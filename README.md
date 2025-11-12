# Invoice Domain Model - PlantUML Diagrams

This directory contains PlantUML diagrams that visualize the Invoice domain model structure and behavior.

## Diagrams

### 1. Invoice Class Diagram (`invoice-class-diagram.puml`)
Detailed class diagram showing the complete `Invoice` aggregate with all its dependencies, properties, methods, and relationships. This diagram shows the immutable invoice structure once it's fully created.

### 2. Draft Invoice Class Diagram (`draft-invoice-class-diagram.puml`)
Detailed class diagram for the `DraftInvoice` entity, which serves as a builder pattern for creating invoices. Shows how all properties are optional until conversion to an `Invoice`.

### 3. Invoice Domain Overview (`invoice-domain-overview.puml`)
High-level overview of the entire invoice domain, showing both `Invoice` and `DraftInvoice` entities along with their key relationships and the main value objects organized in logical packages.

### 4. Invoice State Diagram (`invoice-state-diagram.puml`)
State diagram showing the lifecycle of invoice creation, from empty draft through various states until final conversion to an immutable invoice.

### 5. Invoice Events Sequence (`invoice-events-sequence.puml`)
Sequence diagram illustrating the flow of events during invoice creation, showing how domain events are published at each step of the process.

## Key Domain Concepts

### Invoice
- **Immutable** entity created only when all required data is present
- Contains line items, issuer, recipient, dates, and optional VAT information
- Publishes `InvoiceCreatedEvent` when created

### DraftInvoice
- **Mutable** builder pattern for creating invoices
- All properties are optional until conversion to `Invoice`
- Publishes events for every state change:
  - `DraftInvoiceCreatedEvent` - when draft is created
  - `DraftInvoiceUpdatedEvent` - when properties are added/modified
  - `DraftInvoiceFinishedEvent` - when converted to Invoice

### Key Value Objects
- **Money**: Amount with currency, supports arithmetic operations
- **LineItems**: Collection of line items with validation
- **LineItem**: Individual invoice line with description, quantity, price, and total
- **VatRate**: VAT percentage that can be applied to money amounts
- **Issuer/Recipient**: Party information with billing details

## Generating Visual Diagrams

To generate visual diagrams from these PlantUML files, you can use:

1. **PlantUML Online**: https://www.plantuml.com/plantuml/uml/
2. **VS Code Extension**: PlantUML extension
3. **Command Line**: PlantUML JAR file
4. **IDE Plugins**: Available for most IDEs

## Usage

These diagrams are useful for:
- Understanding the domain model structure
- Onboarding new team members
- Documentation and architecture discussions
- Validating domain design decisions
- Identifying potential refactoring opportunities