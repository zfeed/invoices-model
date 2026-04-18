import { WorkflowClient } from '@temporalio/client';
import { Container } from './container.ts';
import { Session } from '../shared/unit-of-work/unit-of-work.ts';
import { EventOutboxStorage } from '../infrastructure/event-outbox/event-outbox.ts';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus.ts';
import { TemporalWorker } from '../worker.ts';
import { Paypal } from '../features/paypal/api/paypal.ts';
import { createTemporalClient } from './dependencies/temporal-client.ts';
import { createPaypal } from './dependencies/paypal.ts';
import { createEventOutboxStorage } from './dependencies/event-outbox-storage.ts';
import { createKafkaDomainEventsBus } from './dependencies/kafka-domain-events-bus.ts';
import { createSession } from './dependencies/session.ts';
import { createTemporalWorker } from './dependencies/temporal-worker.ts';
import { Logger } from '../shared/logger/logger.ts';
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
    const eventOutboxStorage = createEventOutboxStorage(kysely);
    const domainEventsBus = createKafkaDomainEventsBus(
        eventOutboxStorage,
        logger,
        config
    );
    const session = createSession(kysely, domainEventsBus, eventOutboxStorage);
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
    container.register(EventOutboxStorage, eventOutboxStorage);
    container.register(KafkaDomainEventsBus, domainEventsBus);
    container.register(WorkflowClient, temporalClient);
    container.register(Paypal, paypal);
    container.register(TemporalWorker, temporalWorker);
    container.register('Config', config);
    container.register('Kysely', kysely);

    return container;
};
