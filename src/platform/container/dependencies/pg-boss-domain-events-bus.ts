import { PgBossDomainEventsBus } from '../../infrastructure/domain-events/pg-boss/pg-boss-domain-events-bus.ts';
import { Logger } from '../../../core/building-blocks/logger/logger.ts';
import { Config } from '../../../config.ts';

export const createPgBossDomainEventsBus = (
    logger: Logger,
    config: Config
): PgBossDomainEventsBus =>
    new PgBossDomainEventsBus({
        connectionString: config.database.url,
        logger,
    });
