import PgBoss from 'pg-boss';

import { DomainEventsBus } from '../../../../shared/domain-events/domain-events-bus.interface';
import { ApiResponse } from '../../api/common/api-client';
import { ShowPayoutBatchDetailsQuery } from '../../api/payouts/payouts.types';
import { PayPal } from '../../api/paypal';
import { PayoutBatchDetailsReceivedEvent } from '../events/payout-batch-details-received.event';
import { QUEUE_NAME } from './payouts';
type Job = {
    type: 'payouts.showPayoutBatchDetails';
    payoutBatchId: string;
    query?: ShowPayoutBatchDetailsQuery;
};

export class ShowPayoutBatchDetails {
    readonly type = 'payouts.showPayoutBatchDetails' as const;

    constructor(
        private readonly boss: PgBoss,
        private readonly paypal: PayPal,
        private readonly domainEventsBus: DomainEventsBus
    ) {}

    async send(
        payoutBatchId: string,
        query?: ShowPayoutBatchDetailsQuery
    ): Promise<void> {
        await this.boss.send(QUEUE_NAME, {
            type: 'payouts.showPayoutBatchDetails',
            payoutBatchId,
            query,
        });
    }

    async handle(job: Job): Promise<void> {
        const result = await this.paypal.payouts.showPayoutBatchDetails(
            job.payoutBatchId,
            job.query
        );

        if (result.isError()) {
            throw result.unwrapError();
        }

        const response = result.unwrap();

        if (this.shouldFail(response.statusCode)) {
            throw new Error(
                `PayPal payouts.showPayoutBatchDetails failed: ${response.statusCode}`
            );
        }

        if (!this.shouldEmit(response)) {
            throw new Error(
                `PayPal payouts.showPayoutBatchDetails failed: ${response.statusCode}`
            );
        }

        await this.domainEventsBus.publishEvents({
            events: [PayoutBatchDetailsReceivedEvent.create(response)],
        });
    }

    private shouldFail(statusCode: number): boolean {
        return statusCode === 429 || statusCode >= 500;
    }

    private shouldEmit<T>(
        response: ApiResponse<T>
    ): response is Exclude<ApiResponse<T>, { statusCode: 429 | 500 | 503 }> {
        return !this.shouldFail(response.statusCode);
    }
}
