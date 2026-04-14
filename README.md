# Modular Monolith

## Goal

This project demonstrates how to build a **modular, scalable monolith** with clear and loosely coupled boundaries. Each module is self-contained — with its own domain model, application layer, infrastructure, and HTTP interface — while sharing a common set of building blocks. The goal is to show that a well-structured monolith can achieve the same degree of modularity and separation of concerns as a microservices architecture, without the operational overhead.

Both domains are designed using **Object-Oriented Programming** principles, with entities, value objects, and domain events as core building blocks.

> This project is still under active development. New features will be added.

---

## Key Project Decisions

### OOP domain model with collection-style repositories and a pluggable unit of work

The core domain is modeled with rich OOP entities and value objects that own their invariants and behavior instead of pushing business logic into service layers. Persistence is accessed through collection-like repositories exposed by the unit of work, for example `uow.collection(Invoice).get(...)` or `add(...)`, which keeps application code close to the domain language.

The unit of work itself is pluggable. `Session.begin()` forks a persistence manager, tracks loaded entities through identity maps, commits all tracked changes in one transaction, and can be backed by different storage implementations without changing domain code.

### Errors are represented explicitly with `Result`

Instead of mixing expected business failures with thrown exceptions, the project uses an Either-style `Result` type to model success and failure explicitly. Domain and application code return `Result.error(...)` for validation and business-rule failures, which makes error paths visible in function signatures and easier to compose and test.

Exceptions are reserved for unexpected failures or broken assumptions, while expected domain outcomes are returned as values.

### The API distinguishes contract errors from business errors

The HTTP layer separates malformed requests from valid requests that fail business rules:

- `400 Bad Request` is used for contract errors such as invalid JSON or schema/validation failures.
- `422 Unprocessable Entity` is used for domain and application errors when the request shape is valid but the requested operation is not allowed by business rules.

That distinction keeps clients from conflating transport/input problems with real domain rejections.

### Full OpenTelemetry support

The project is instrumented end to end with OpenTelemetry. It exports traces, logs, and metrics, and includes instrumentation for Fastify, HTTP, PostgreSQL, Pino, Undici, and Temporal components. Manual spans are also used around application startup, request handling, domain event delivery, and outbox polling so internal workflow is observable, not just framework edges.

### Transactional outbox for reliable event delivery

Domain events are written to `event_outbox` in the same database transaction as aggregate state changes. After commit, the bus publishes them and the outbox can poll and retry undelivered records with delivery-attempt tracking and time-based backoff.

This prevents lost events when a write succeeds but event delivery fails, and gives the system a built-in recovery path for transient messaging problems.

---

## Project Structure

```
src/
  building-blocks/              # Result monad, DomainEvent base, errors, interfaces
  features/
    invoices/                   # Invoice module (OOP, class-based)
      domain/                   # Entities, value objects, events, checks
      application/              # Use cases
      infrastructure/           # In-memory storage, data mappers
      http/                     # Fastify routes and schemas
    financial-authorization/    # Authorization module (OOP, class-based)
      domain/                   # Entities, value objects, events, checks
      application/              # Use cases, event handlers, queries
      infrastructure/           # In-memory storage, data mappers
      http/                     # Fastify routes and schemas
  infrastructure/               # Shared infra: domain events, event outbox
  http/                         # Shared Fastify app setup, error handler, plugins
e2e/                            # End-to-end tests
```

---

## Domains Overview

### Invoices

Handles creation and lifecycle management of financial invoices. Invoices start as mutable drafts and become immutable once finalized. Implemented as OOP classes with private fields, encapsulated state, and methods that enforce business rules.

**Core entities:** `Invoice`, `DraftInvoice`

**Value objects:** `Money`, `Currency`, `LineItem`, `LineItems`, `VatRate`, `Issuer`, `Recipient`, `CalendarDate`, `Email`, `Country`

**Domain events:** `DraftInvoiceCreatedEvent`, `DraftInvoiceUpdatedEvent`, `DraftInvoiceFinishedEvent`, `InvoiceCreatedEvent`

---

### Financial Authorization

Models multi-step approval workflows for financial documents. Supports hierarchical approval structures with multiple authflows, steps, groups, and approvers. Implemented using OOP with plain TypeScript types and factory functions.

**Core entities:** `Document`, `Authflow`, `Step`, `Group`, `Approver`, `Approval`

**Approval hierarchy:**

```
Document
└── Authflow (action-specific workflow)
    └── Step (ordered stage)
        └── Group (approver pool)
            ├── Approver (authorized person)
            └── Approval (approval record)
```

---

## Shared Building Blocks

| Component             | Description                                  |
| --------------------- | -------------------------------------------- |
| **Result**            | Functional error handling (Ok/Error pattern) |
| **DomainError**       | Base class for domain-level errors           |
| **ApplicationError**  | Base class for application-level errors      |
| **DomainEvent**       | Base class for domain events                 |
| **PublishableEvents** | Interface for entities that emit events      |
| **Equatable**         | Interface for value object equality          |
| **Comparable**        | Interface for value object comparison        |

---

## Further Reading

### Books

- [Practical Object-Oriented Design in Ruby](https://www.amazon.com/Practical-Object-Oriented-Design-Ruby-Addison-Wesley/dp/0321721330) — Sandi Metz
- [Object-Oriented Software Construction](https://www.amazon.com/Object-Oriented-Software-Construction-Book-CD-ROM/dp/0136291554) — Bertrand Meyer
- [Patterns of Enterprise Application Architecture](https://www.amazon.com/Patterns-Enterprise-Application-Architecture-Martin/dp/0321127420) — Martin Fowler
- [Designing Data-Intensive Applications](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1098119061) — Martin Kleppmann
- [Applying UML and Patterns](https://www.amazon.com/Applying-UML-Patterns-Introduction-Object-Oriented/dp/0130925691) — Craig Larman

### Articles & Talks

- [Don't Mock Types You Don't Own](https://davesquared.net/2011/04/dont-mock-types-you-dont-own.html) — Dave Squared
- [Integrated Tests Are A Scam](https://www.youtube.com/watch?v=VDfX44fZoMc) — J. B. Rainsberger
- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM) — Ian Cooper
- [TDD Revisited](https://www.youtube.com/watch?v=IN9lftH0cJc) — Ian Cooper
