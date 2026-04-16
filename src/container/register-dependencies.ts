import { WorkflowClient } from '@temporalio/client';
import { Container } from './container';
import { Session } from '../shared/unit-of-work/unit-of-work';
import { EventOutboxStorage } from '../infrastructure/event-outbox/event-outbox';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus';
import { TemporalWorker } from '../worker';
import { Paypal } from '../features/paypal/api/paypal';
import { createTemporalClient } from './dependencies/temporal-client';
import { createPaypal } from './dependencies/paypal';
import { createEventOutboxStorage } from './dependencies/event-outbox-storage';
import { createKafkaDomainEventsBus } from './dependencies/kafka-domain-events-bus';
import { createSession } from './dependencies/session';
import { createTemporalWorker } from './dependencies/temporal-worker';
import { Logger } from '../shared/logger/logger';
import { createLogger } from './dependencies/logger';
import { createPino } from './dependencies/pino';
import { pino as Pino } from 'pino';
import { config } from '../config';

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
