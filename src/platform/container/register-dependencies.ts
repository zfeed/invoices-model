import { WorkflowClient } from '@temporalio/client';
import { Container } from '../../lib/container/container.ts';
import { Session } from '../../core/building-blocks/unit-of-work/unit-of-work.ts';
import { PgBossDomainEventsBus } from '../infrastructure/domain-events/pg-boss/pg-boss-domain-events-bus.ts';
import { TemporalWorker } from '../worker.ts';
import { Paypal } from '../../lib/paypal/paypal.ts';
import { createTemporalClient } from './dependencies/temporal-client.ts';
import { createPaypal } from './dependencies/paypal.ts';
import { createPgBossDomainEventsBus } from './dependencies/pg-boss-domain-events-bus.ts';
import { createSession } from './dependencies/session.ts';
import { createTemporalWorker } from './dependencies/temporal-worker.ts';
import { Logger } from '../../core/building-blocks/logger/logger.ts';
import { createLogger } from './dependencies/logger.ts';
import { createPino } from './dependencies/pino.ts';
import { createConfig } from './dependencies/config.ts';
import { createKysely } from './dependencies/kysely.ts';
import { pino as Pino } from 'pino';

export const registerDependencies = async (): Promise<Container> => {
    const container = new Container();

    const config = createConfig();
    const kysely = createKysely(config);
    const pino = createPino(config.logger);
    const logger = createLogger({ pino });
    const domainEventsBus = createPgBossDomainEventsBus(logger, config);
    const session = createSession(kysely, domainEventsBus, logger);
    const temporalClient = await createTemporalClient(config);
    const paypal = createPaypal(config);
    const temporalWorker = createTemporalWorker(
        paypal,
        session,
        logger,
        config
    );

    container.register(Pino, pino);
    container.register(Logger, logger);
    container.register(Session, session);
    container.register(PgBossDomainEventsBus, domainEventsBus);
    container.register(WorkflowClient, temporalClient);
    container.register(Paypal, paypal);
    container.register(TemporalWorker, temporalWorker);
    container.register('Config', config);
    container.register('Kysely', kysely);

    return container;
};
