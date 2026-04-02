import { DomainEventsBus } from '../../../../shared/domain-events/domain-events-bus.interface';
import { Session } from '../../../../shared/unit-of-work/unit-of-work';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import { FinancialDocument } from '../../domain/document/document';
import { Money } from '../../domain/money/money';
import { ReferenceId } from '../../domain/reference-id/reference-id';

export class OnInvoiceIssued {
    constructor(
        private readonly session: Session,
        private readonly domainEventsBus: DomainEventsBus
    ) {}

    public async register() {
        await this.domainEventsBus.subscribeToEvent(
            InvoiceIssuedEvent,
            (event) => this.handle(event)
        );
    }

    private async handle(event: InvoiceIssuedEvent): Promise<void> {
        const referenceId = ReferenceId.create(event.data.id).unwrap();
        const value = Money.create(
            event.data.total.amount,
            event.data.total.currency
        ).unwrap();

        await using uow = await this.session.begin();

        const existing = await uow
            .collection(FinancialDocument)
            .findBy('referenceId', referenceId.toPlain());

        if (existing) {
            return;
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

        const document = FinancialDocument.create({
            referenceId,
            value,
            authflows,
        }).unwrap();

        await uow.collection(FinancialDocument).add(document);

        await uow.commit();
    }
}
