import { ApplicationFailure } from '@temporalio/activity';
import { CreateBatchPayoutRequestBody } from '../../../../lib/paypal/payouts/payouts.types.ts';
import { Paypal } from '../../../../lib/paypal/paypal.ts';

export class CreatePayout {
    constructor(private paypal: Paypal) {}

    async execute(invoiceId: string, body: CreateBatchPayoutRequestBody) {
        const result = await this.paypal.payouts.createBatchPayout(body, {
            idempotencyKey: invoiceId,
        });

        const response = result.unwrap();

        if (response.statusCode === 200 || response.statusCode === 201) {
            return {
                result: 'created',
                payoutBatchId: response.body.batch_header.payout_batch_id,
            } as const;
        }

        if (response.statusCode === 429 || response.statusCode >= 500) {
            throw ApplicationFailure.create({
                message: `PayPal createBatchPayout failed with status ${response.statusCode}: ${JSON.stringify(response.body)}`,
                type: 'PaypalCreatePayoutRetryableError',
            });
        }

        return {
            result: 'failed',
        } as const;
    }
}
