# CLAUDE.md

## Project Overview

TypeScript DDD codebase with two bounded contexts: **invoices** (OOP class-based) and **financial-authorization** (functional/plain-object). Monadic building blocks (Result, Some, IO) in `building-blocks/`.

## Testing

- This project uses **Jest** with ts-jest. NEVER use vitest.
- Run tests: `npx jest`
- Run specific tests: `npx jest --testPathPattern <pattern>`
- When fixing failing tests, NEVER modify production/source code unless explicitly asked. Fix the tests to match the current source contracts first. Only modify source code if a genuine bug is found.
- Test files are co-located with source using `.spec.ts` suffix.
- No call count assertions (e.g. `toHaveBeenCalledTimes`). No `expect(x).toBeInstanceOf(Error)` — use Result type checks instead.

## Domain Conventions

- Always reuse existing factory methods (`create`) for entity reconstruction from persistence. Never add separate `reconstruct` or `fromPersistence` methods unless explicitly asked.
- Error-returning functions must return `Result<DomainError, T>` — never throw.
- Domain naming matters. Use exact method names as specified (e.g., `draft()` not `toDraft()`, `create` not `reconstruct`). When a name is corrected, apply the correction across all related files immediately.
- Version/concurrency fields belong ON the entity/document itself, not in separate internal maps or tracking structures.
- Status types use class hierarchies with static factory methods (e.g., `InvoiceStatus.issued()`), transition guards, and `fromString` reconstruction.
- Event names are auto-derived from class name: `DraftInvoiceCreatedEvent` → `draft-invoice.created` (dot-separated kebab-case).

## Code Style

- Prefer functional composition patterns: rambda `when`/`ifElse`, Result/Some/IO monads, flat pipelines.
- Avoid class-based implementations when a functional approach is asked for. Avoid manual object reconstruction, wrapper functions, and explicit type aliases unless asked.
- When asked for functional style, use the existing monadic types in `building-blocks/` — do not introduce new wrapper constructs.
- **financial-authorization** context: functional style with Ramda (`applySpec`, `prop`, `map`, `find`, `propEq`), plain types, factory functions.
- **invoices** context: OOP style with private `#fields`, `protected constructor`, static `create`/`fromString` factories, `toPlain()` serialization, `Equatable<T>`.
- Domain events in financial-authorization use `applySpec`/`prop` for data transformation in constructors.
- Domain events in invoices pass `toPlain()` output as event data.

## Project Structure

```
building-blocks/     # Result, Some, IO monads, DomainEvent base, errors
core/
  invoices/          # OOP class-based bounded context
    domain/          # Entities, value objects, events, checks
    application/     # Use cases, unit-of-work interface
  financial-authorization/  # Functional bounded context
    domain/          # Plain types, factory functions, events, checks
    application/     # Use cases, storage interfaces
  shared/            # Cross-context interfaces (domain-events, optimistic concurrency)
infrastructure/      # In-memory implementations (store, storage, mappers, domain-events)
```

## Key Patterns

- **financial-authorization**: `Result.ok(data).flatMap(check1).flatMap(check2).map(build)` — validation pipelines with checks as standalone functions returning `Result<DomainError, T>`, composed via flatMap
- `withEvents(entity, [new SomeEvent(entity)])` — attaching domain events to entities
- `PublishableEvents<E>` interface for event publishing
- In-memory infrastructure with versioned store for optimistic concurrency
