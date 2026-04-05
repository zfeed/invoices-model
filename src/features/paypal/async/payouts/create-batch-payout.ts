import PgBoss from 'pg-boss';

import { DomainEventsBus } from '../../../../shared/domain-events/domain-events-bus.interface';
import { ApiResponse } from '../../api/common/api-client';
import { CreateBatchPayoutRequestBody } from '../../api/payouts/payouts.types';
import { PayPal } from '../../api/paypal';
import { BatchPayoutCreatedEvent } from '../events/batch-payout-created.event';
import { QUEUE_NAME } from './payouts';
type Job = {
    type: 'payouts.createBatchPayout';
    body: CreateBatchPayoutRequestBody;
    options?: { idempotencyKey?: string };
};

export class CreateBatchPayout {
    readonly type = 'payouts.createBatchPayout' as const;

    constructor(
        private readonly boss: PgBoss,
        private readonly paypal: PayPal,
        private readonly domainEventsBus: DomainEventsBus
    ) {}

    async send(
        body: CreateBatchPayoutRequestBody,
        options?: { idempotencyKey?: string }
    ): Promise<void> {
        await this.boss.send(QUEUE_NAME, {
            type: 'payouts.createBatchPayout',
            body,
            options,
        });
    }

    async handle(job: Job): Promise<void> {
        const result = await this.paypal.payouts.createBatchPayout(
            job.body,
            job.options
        );

        if (result.isError()) {
            throw result.unwrapError();
        }

        const response = result.unwrap();

        if (this.shouldFail(response.statusCode)) {
            throw new Error(
                `PayPal payouts.createBatchPayout failed: ${response.statusCode}`
            );
        }

        if (!this.shouldEmit(response)) {
            throw new Error(
                `PayPal payouts.createBatchPayout failed: ${response.statusCode}`
            );
        }

        await this.domainEventsBus.publishEvents({
            events: [BatchPayoutCreatedEvent.create(response)],
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
