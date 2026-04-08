import { ApplicationFailure } from '@temporalio/activity';
import { PayPal } from '../../../paypal/api/paypal';
import { BatchStatus } from '../../../paypal/api/payouts/payouts.types';

export type FetchPayoutStatusResult =
    | { result: 'fetched'; status: BatchStatus }
    | { result: 'failed' };

export class FetchPayoutStatus {
    constructor(private paypal: PayPal) {}

    async execute(payoutBatchId: string): Promise<FetchPayoutStatusResult> {
        const result =
            await this.paypal.payouts.showPayoutBatchDetails(payoutBatchId);

        const response = result.unwrap();

        if (response.statusCode === 200 || response.statusCode === 201) {
            return {
                result: 'fetched',
                status: response.body.batch_header.batch_status,
            };
        }

        if (response.statusCode === 429 || response.statusCode >= 500) {
            throw ApplicationFailure.create({
                message: `PayPal showPayoutBatchDetails failed with status ${response.statusCode}: ${JSON.stringify(response.body)}`,
                type: 'PaypalFetchPayoutStatusRetryableError',
            });
        }

        return { result: 'failed' };
    }
}
