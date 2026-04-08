import { WorkflowClient, WorkflowIdConflictPolicy } from '@temporalio/client';
import { DomainEventsBus } from '../../shared/domain-events/domain-events-bus.interface';
import { InvoiceProcessingEvent } from '../invoices/domain/invoice/events/invoice-processing.event';
import { CreateBatchPayoutRequestBody } from '../paypal/api/payouts/payouts.types';
import { INVOICE_PAYPAL_TX_TASK_QUEUE } from './task-queue';
import {
    processInvoicePaypalTransaction,
    ProcessInvoicePaypalTransactionInput,
} from './workflow/process-invoice-paypal-transaction.workflow';

export type PollingConfig = {
    maxAttempts: number;
    initialDelayMs: number;
    factor: number;
};

const buildPayoutRequest = (
    data: InvoiceProcessingEvent['data']
): CreateBatchPayoutRequestBody => ({
    sender_batch_header: {
        sender_batch_id: data.id,
        email_subject: `Payment for invoice ${data.id}`,
    },
    items: [
        {
            recipient_type: 'EMAIL',
            receiver: data.recipient.billing.data.email,
            amount: {
                currency: data.total.currency,
                value: data.total.amount,
            },
            sender_item_id: data.id,
            note: `Payment for invoice ${data.id}`,
        },
    ],
});

export class OnInvoiceProcessing {
    constructor(
        private readonly domainEventsBus: DomainEventsBus,
        private readonly temporal: WorkflowClient,
        private readonly polling: PollingConfig
    ) {}

    public async register() {
        await this.domainEventsBus.subscribeToEvent(
            InvoiceProcessingEvent,
            (event) => this.handle(event)
        );
    }

    private async handle(event: InvoiceProcessingEvent): Promise<void> {
        const input: ProcessInvoicePaypalTransactionInput = {
            invoiceId: event.data.id,
            payoutRequest: buildPayoutRequest(event.data),
            polling: this.polling,
        };

        await this.temporal.start(processInvoicePaypalTransaction, {
            taskQueue: INVOICE_PAYPAL_TX_TASK_QUEUE,
            workflowId: `invoice-paypal-tx-${event.data.id}`,
            workflowIdConflictPolicy: WorkflowIdConflictPolicy.USE_EXISTING,
            args: [input],
        });
    }
}
