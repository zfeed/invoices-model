# CLAUDE.md

## Project Overview

TypeScript DDD codebase with two bounded contexts: **invoices** (OOP class-based) and **financial-authorization** (functional/plain-object). Monadic building blocks (Result, Some, IO) in `building-blocks/`.

## Testing

- This project uses **Vitest**.
- Run tests: `npx vitest run`
- Run specific tests: `npx vitest run <pattern>`
- When fixing failing tests, NEVER modify production/source code unless explicitly asked. Fix the tests to match the current source contracts first. Only modify source code if a genuine bug is found.
- Test files are co-located with source using `.spec.ts` suffix.
- No call count assertions (e.g. `toHaveBeenCalledTimes`). No `expect(x).toBeInstanceOf(Error)` — use Result type checks instead.

## Domain Conventions

- Always reuse existing factory methods (`create`) for entity reconstruction from persistence. Never add separate `reconstruct` or `fromPersistence` methods unless explicitly asked.
- Error-returning functions must return `Result<DomainError, T>` — never throw.
- Domain naming matters. Use exact method names as specified (e.g., `draft()` not `toDraft()`, `create` not `reconstruct`). When a name is corrected, apply the correction across all related files immediately.
- Version/concurrency fields belong ON the entity/document itself, not in separate internal maps or tracking structures.
- Status types use class hierarchies with static factory methods (e.g., `InvoiceStatus.issued()`), transition guards, `fromPlain` for trusted reconstruction, and `fromString` for validated parsing.
- Event names are auto-derived from class name: `DraftInvoiceCreatedEvent` → `draft-invoice.created` (dot-separated kebab-case).

## Formatting

- After all changes to files, run `npm run format` to format the code.

## Code Style

- Prefer functional composition patterns: rambda `when`/`ifElse`, Result/Some/IO monads, flat pipelines.
- Avoid class-based implementations when a functional approach is asked for. Avoid manual object reconstruction, wrapper functions, and explicit type aliases unless asked.
- When asked for functional style, use the existing monadic types in `building-blocks/` — do not introduce new wrapper constructs.
- **financial-authorization** context: functional style with Ramda (`applySpec`, `prop`, `map`, `find`, `propEq`), plain types, factory functions.
- **invoices** context: OOP style with private `#fields`, `protected constructor`, static `create`/`fromPlain` factories, `toPlain()` serialization, `Equatable<T>`. Status types use `fromPlain` for trusted reconstruction and `fromString` for validated parsing (returns `Result`).
- Domain events in financial-authorization use `applySpec`/`prop` for data transformation in constructors.
- Domain events in invoices pass `toPlain()` output as event data.

## HTTP Conventions

- HTTP routes use only **POST** and **GET** methods. No PUT, PATCH, or DELETE.
- Actions are expressed via URL path segments (e.g., `POST /invoices/drafts/:id/update`, not `PUT /invoices/drafts/:id`).
- All successful responses return **200**. Never use 201 or other 2xx codes.

## Project Structure

```
src/
  building-blocks/   # Result, Some, IO monads, DomainEvent base, errors
  core/
    invoices/          # OOP class-based bounded context
      domain/          # Entities, value objects, events, checks
      application/     # Use cases, unit-of-work interface
    financial-authorization/  # Functional bounded context
      domain/          # Plain types, factory functions, events, checks
      application/     # Use cases, storage interfaces
    shared/            # Cross-context interfaces (domain-events, optimistic concurrency)
  infrastructure/    # In-memory implementations (store, storage, mappers, domain-events)
  http/              # Hono HTTP layer (routes, schemas, validation)
e2e/                 # E2E tests (outside src/)
```

## Key Patterns

- **financial-authorization value objects**: every value object (`Name`, `Email`, `Comment`, `Id`, `Order`, `Action`, `ReferenceId`, `Money`) has a factory function (`createName`, `createEmail`, etc.) that returns `Result<DomainError, T>` with validation. Each has a `checks/` folder with standalone check functions using the `ifElse(predicate, createError, Result.ok)` pattern from Ramda.
- **financial-authorization factory inputs**: factory functions accept raw primitives (`string`, `number`, `string | null`), not domain type aliases. The factory validates and produces the domain type.
- **financial-authorization composite factories**: composites (`createApproval`, `createApprover`) validate fields via their value-object factories using nested `flatMap`:
    ```ts
    export const createApproval = (
        data: ApprovalInput
    ): Result<DomainError, Approval> =>
        fromString(data.approverId).flatMap((approverId) =>
            createComment(data.comment)
                .map((comment) => ({ approverId, comment }))
                .map(buildApproval)
        );
    ```
- **financial-authorization aggregate operations**: functions like `approveGroup`, `approveStep`, `approveAuthflow`, `approveDocument` take positional arguments (not data objects) and use nested `flatMap` chains — no intermediate accumulation types.
- **financial-authorization build functions**: use `applySpec<Entity>({ field: prop('field'), id: () => createId() })` to construct domain structures from validated input — never manual object literals
- **financial-authorization aggregate checks**: aggregate-level invariants (e.g., no duplicate approvers, approvers not empty) live in the aggregate's own `checks/` folder and operate on the composite input type
- `withEvents(entity, [new SomeEvent(entity)])` — attaching domain events to entities
- `PublishableEvents<E>` interface for event publishing
- In-memory infrastructure with versioned store for optimistic concurrency
