import { DomainEventsBus } from '../../../shared/domain-events/domain-events-bus.interface';
import { InvoiceProcessingEvent } from '../../invoices/domain/invoice/events/invoice-processing.event';
import { Payouts } from '../async/payouts/payouts';

export class OnInvoiceProcessing {
    constructor(
        private readonly payouts: Payouts,
        private readonly domainEventsBus: DomainEventsBus
    ) {}

    public async register() {
        await this.domainEventsBus.subscribeToEvent(
            InvoiceProcessingEvent,
            (event) => this.handle(event)
        );
    }

    private async handle(event: InvoiceProcessingEvent): Promise<void> {
        await this.payouts.createBatchPayout(
            {
                sender_batch_header: {
                    sender_batch_id: event.data.id,
                },
                items: [
                    {
                        receiver: event.data.recipient.billing.data.email,
                        amount: {
                            currency: event.data.total.currency,
                            value: event.data.total.amount,
                        },
                        recipient_type: 'EMAIL',
                        note: `Payment for invoice ${event.data.id}`,
                    },
                ],
            },
            { idempotencyKey: event.id }
        );
    }
}
