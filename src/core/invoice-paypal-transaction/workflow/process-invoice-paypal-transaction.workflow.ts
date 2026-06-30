import { proxyActivities, sleep } from '@temporalio/workflow';
import type { CreateBatchPayoutRequestBody } from '../../../lib/paypal/payouts/payouts.types.ts';
import type { Activities } from './activities/index.ts';

export type ProcessInvoicePaypalTransactionInput = {
    invoiceId: string;
    organizationId: string;
    payoutRequest: CreateBatchPayoutRequestBody;
    polling: {
        maxAttempts: number;
        initialDelayMs: number;
        factor: number;
    };
};

const acts = proxyActivities<Activities>({
    startToCloseTimeout: '1 minute',
    retry: {
        maximumAttempts: 10,
    },
});

export async function processInvoicePaypalTransaction(
    input: ProcessInvoicePaypalTransactionInput
): Promise<void> {
    const createResult = await acts.createPayout(
        input.invoiceId,
        input.payoutRequest
    );

    if (createResult.result === 'failed') {
        await acts.failInvoice(input.invoiceId, input.organizationId);
        return;
    }

    const { payoutBatchId } = createResult;

    let delay = input.polling.initialDelayMs;

    for (let attempt = 0; attempt < input.polling.maxAttempts; attempt++) {
        await sleep(delay);

        const fetchResult = await acts.fetchPayoutStatus(payoutBatchId);

        if (fetchResult.result === 'failed') {
            await acts.failInvoice(input.invoiceId, input.organizationId);
            return;
        }

        const status = fetchResult.status;

        if (status === 'SUCCESS') {
            await acts.payInvoice(input.invoiceId, input.organizationId);
            return;
        }

        if (status === 'DENIED' || status === 'CANCELED') {
            await acts.failInvoice(input.invoiceId, input.organizationId);
            return;
        }

        delay = Math.floor(delay * input.polling.factor);
    }
}
