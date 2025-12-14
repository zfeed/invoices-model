# Domain-Driven Design Models

This repository contains two domain models implemented using Domain-Driven Design (DDD) principles in TypeScript.

## Domains Overview

### 1. Invoices Domain (`/invoices`)

**Paradigm:** Object-Oriented Programming (OOP)

The Invoices domain handles the creation and management of financial invoices. It follows a builder pattern where invoices start as mutable drafts and become immutable once finalized. Entities are implemented as classes with private fields, encapsulated state, and methods that enforce business rules.

#### Core Entities

| Entity           | Description                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invoice**      | Immutable entity representing a finalized invoice. Contains line items, issuer, recipient, dates, totals, and optional VAT. Created only when all required data is present. |
| **DraftInvoice** | Mutable builder for creating invoices. All properties are optional until conversion to `Invoice`. Supports incremental updates.                                             |

#### Value Objects

| Value Object     | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| **Money**        | Monetary amount with currency, supports arithmetic operations             |
| **Currency**     | ISO 4217 currency code                                                    |
| **LineItem**     | Individual invoice line with description, quantity, unit price, and total |
| **LineItems**    | Collection of line items with validation and subtotal calculation         |
| **VatRate**      | VAT percentage that can be applied to money amounts                       |
| **Issuer**       | Party issuing the invoice                                                 |
| **Recipient**    | Party receiving the invoice, includes billing details                     |
| **CalendarDate** | ISO 8601 date representation                                              |
| **Email**        | Validated email address                                                   |
| **Country**      | ISO country code                                                          |

#### Domain Events

- `DraftInvoiceCreatedEvent` — when a new draft is created
- `DraftInvoiceUpdatedEvent` — when draft properties are modified
- `DraftInvoiceFinishedEvent` — when draft is converted to invoice
- `InvoiceCreatedEvent` — when a finalized invoice is created

---

### 2. Financial Authorization Domain (`/financial-authorization`)

**Paradigm:** Functional Programming (FP)

The Financial Authorization domain models multi-step approval workflows for financial documents. It supports hierarchical approval structures with multiple authflows, steps, groups, and approvers. Entities are implemented as plain TypeScript types with factory functions, using functional composition with `Result` monads and libraries like Ramda for data transformations.

#### Core Entities

| Entity       | Description                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document** | Top-level entity representing a financial document requiring authorization. Contains multiple authflows for different actions.                             |
| **Authflow** | Authorization flow for a specific action (e.g., "approve", "reject"). Contains ordered steps that must be completed. Approved when all steps are approved. |
| **Step**     | Ordered step within an authflow. Contains groups of approvers. Approved when all groups are approved.                                                      |
| **Group**    | Collection of approvers who can authorize a step. Approved when at least one approval exists.                                                              |
| **Approver** | Person authorized to approve, identified by name and email.                                                                                                |
| **Approval** | Record of an approval action with timestamp and optional comment.                                                                                          |

#### Approval Hierarchy

```
Document
└── Authflow (action-specific workflow)
    └── Step (ordered stage)
        └── Group (approver pool)
            ├── Approver (authorized person)
            └── Approval (approval record)
```

#### Validation Rules

- No duplicate authflow actions per document
- No duplicate step orders within an authflow
- No duplicate approvers within a group
- No duplicate approvals within a group
- Approvals must reference existing approvers
- Step order must be non-negative
- Valid email format for approvers

---

## Shared Building Blocks (`/building-blocks`)

Common infrastructure shared across both domains:

| Component             | Description                                  |
| --------------------- | -------------------------------------------- |
| **Result**            | Functional error handling (Ok/Error pattern) |
| **DomainError**       | Base class for domain-level errors           |
| **ApplicationError**  | Base class for application-level errors      |
| **DomainEvent**       | Base class for domain events                 |
| **PublishableEvents** | Interface for entities that emit events      |
| **Equatable**         | Interface for value object equality          |
| **Comparable**        | Interface for value object comparison        |

## PlantUML Diagrams (`/diagrams`)

Visual documentation of the domain models:

- `invoice-class-diagram.puml` — Detailed Invoice aggregate structure
- `draft-invoice-class-diagram.puml` — DraftInvoice entity diagram
- `invoice-domain-overview.puml` — High-level domain overview
- `invoice-state-diagram.puml` — Invoice lifecycle states
- `invoice-events-sequence.puml` — Event flow during invoice creation

### Generating Diagrams

1. **PlantUML Online**: https://www.plantuml.com/plantuml/uml/
2. **VS Code Extension**: PlantUML extension
3. **Command Line**: PlantUML JAR file

## Project Structure

```
├── building-blocks/       # Shared DDD infrastructure
├── diagrams/              # PlantUML documentation
├── financial-authorization/
│   ├── approval/          # Approval value object
│   ├── approver/          # Approver entity
│   ├── authflow/          # Authorization flow
│   ├── document/          # Document aggregate root
│   ├── groups/            # Approver groups
│   └── step/              # Approval steps
└── invoices/
    ├── application/       # Use cases and collections
    └── domain/
        ├── calendar-date/ # Date value object
        ├── country/       # Country value object
        ├── draft-invoice/ # Draft invoice entity
        ├── email/         # Email value object
        ├── id/            # ID value object
        ├── invoice/       # Invoice aggregate root
        ├── issuer/        # Issuer value object
        ├── line-item/     # Line item value object
        ├── line-items/    # Line items collection
        ├── money/         # Money & currency
        ├── numeric/       # Numeric utilities
        ├── recipient/     # Recipient value object
        └── vat-rate/      # VAT rate value object
```
