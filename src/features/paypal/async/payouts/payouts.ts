import PgBoss from 'pg-boss';

import { DomainEventsBus } from '../../../../shared/domain-events/domain-events-bus.interface';
import { Config } from '../../api/common/api-client';
import {
    CreateBatchPayoutRequestBody,
    ShowPayoutBatchDetailsQuery,
} from '../../api/payouts/payouts.types';
import { PayPal } from '../../api/paypal';
import { CreateBatchPayout } from './create-batch-payout';
import { ShowPayoutBatchDetails } from './show-payout-batch-details';

export const QUEUE_NAME = 'paypal';

type Credentials = {
    clientId: string;
    clientSecret: string;
};

export class Payouts {
    private readonly _createBatchPayout: CreateBatchPayout;
    private readonly _showPayoutBatchDetails: ShowPayoutBatchDetails;
    private readonly handlers: Map<
        string,
        { handle(job: { type: string }): Promise<void> }
    >;

    constructor(
        private readonly boss: PgBoss,
        private readonly domainEventsBus: DomainEventsBus,
        config: Config & { credentials: Credentials },
        paypal: PayPal = new PayPal(config)
    ) {
        this._createBatchPayout = new CreateBatchPayout(
            boss,
            paypal,
            domainEventsBus
        );
        this._showPayoutBatchDetails = new ShowPayoutBatchDetails(
            boss,
            paypal,
            domainEventsBus
        );

        this.handlers = new Map<
            string,
            { handle(job: { type: string }): Promise<void> }
        >([
            [this._createBatchPayout.type, this._createBatchPayout],
            [this._showPayoutBatchDetails.type, this._showPayoutBatchDetails],
        ]);
    }

    async createBatchPayout(
        body: CreateBatchPayoutRequestBody,
        options?: { idempotencyKey?: string }
    ): Promise<void> {
        return this._createBatchPayout.send(body, options);
    }

    async showPayoutBatchDetails(
        payoutBatchId: string,
        query?: ShowPayoutBatchDetailsQuery
    ): Promise<void> {
        return this._showPayoutBatchDetails.send(payoutBatchId, query);
    }

    async register(): Promise<string> {
        await this.boss.createQueue(QUEUE_NAME);

        return this.boss.work<{ type: string }>(QUEUE_NAME, async (jobs) => {
            for (const job of jobs) {
                const handler = this.handlers.get(job.data.type);

                if (!handler) {
                    throw new Error(
                        `No handler registered for job type: ${job.data.type}`
                    );
                }

                await handler.handle(job.data);
            }
        });
    }
}
