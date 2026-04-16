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
import { pino as Pino } from 'pino';
import { config } from '../config.ts';

export const registerDependencies = async (): Promise<Container> => {
    const container = new Container();

    const pino = createPino(config.logger.level);
    const logger = createLogger({ pino });
    const eventOutboxStorage = createEventOutboxStorage();
    const domainEventsBus = createKafkaDomainEventsBus(
        eventOutboxStorage,
        logger
    );
    const session = createSession(domainEventsBus, eventOutboxStorage);
    const temporalClient = await createTemporalClient();
    const paypal = createPaypal();
    const temporalWorker = createTemporalWorker(paypal, session, logger);

    container.register(Pino, pino);
    container.register(Logger, logger);
    container.register(Session, session);
    container.register(EventOutboxStorage, eventOutboxStorage);
    container.register(KafkaDomainEventsBus, domainEventsBus);
    container.register(WorkflowClient, temporalClient);
    container.register(Paypal, paypal);
    container.register(TemporalWorker, temporalWorker);

    return container;
};
