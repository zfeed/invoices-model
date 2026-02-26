import { DomainEvents } from '../../../shared/domain-events/domain-events.interface';
import { Session } from '../../../shared/unit-of-work/unit-of-work.interface';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import { FinancialDocument } from '../../domain/document/document';
import { Money } from '../../domain/money/money';
import { ReferenceId } from '../../domain/reference-id/reference-id';

export class OnInvoiceIssued {
    constructor(
        private readonly session: Session,
        private readonly domainEvents: DomainEvents
    ) {}

    public async register() {
        await this.domainEvents.subscribeToEvent(InvoiceIssuedEvent, (event) =>
            this.handle(event)
        );
    }

    private async handle(event: InvoiceIssuedEvent): Promise<void> {
        const referenceId = ReferenceId.create(event.data.id).unwrap();
        const value = Money.create(
            event.data.total.amount,
            event.data.total.currency
        ).unwrap();

        const document = await this.session.start(async (uow) => {
            const existing = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', referenceId.toPlain());

            if (existing) {
                return null;
            }

            const policy = await uow
                .collection(AuthflowPolicy)
                .findBy('action', 'pay');

            const authflows = policy
                ? (() => {
                      const result = policy.selectAuthflow(value);
                      return result.isOk() ? [result.unwrap()] : [];
                  })()
                : [];

            const doc = FinancialDocument.create({
                referenceId,
                value,
                authflows,
            }).unwrap();

            await uow.collection(FinancialDocument).add(doc);

            return doc;
        });

        if (document) {
            await this.domainEvents.publishEvents(document);
        }
    }
}
