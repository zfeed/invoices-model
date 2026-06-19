import { PgBossDomainEventsBus } from '../../infrastructure/domain-events/pg-boss/pg-boss-domain-events-bus.ts';
import { Logger } from '../../../core/building-blocks/logger/logger.ts';
import { Config } from '../../../config.ts';

export const createPgBossDomainEventsBus = (
    logger: Logger,
    config: Config
): PgBossDomainEventsBus =>
    new PgBossDomainEventsBus({
        connectionString: config.database.url,
        // pg-boss workers poll for jobs; its default is 2s. Poll at the
        // minimum 0.5s so domain events are delivered with low latency.
        pollingIntervalSeconds: 0.5,
        logger,
    });
