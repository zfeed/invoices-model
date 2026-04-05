import PgBoss from 'pg-boss';

import { DomainEventsBus } from '../../../shared/domain-events/domain-events-bus.interface';
import { Config } from '../api/common/api-client';
import { Payouts } from './payouts/payouts';

type Credentials = {
    clientId: string;
    clientSecret: string;
};

export class AsyncPaypal {
    payouts: Payouts;

    constructor(
        boss: PgBoss,
        domainEventsBus: DomainEventsBus,
        config: Config & { credentials: Credentials }
    ) {
        this.payouts = new Payouts(boss, domainEventsBus, config);
    }
}
