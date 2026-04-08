import { Connection, WorkflowClient } from '@temporalio/client';
import { Container } from './container';
import { bootstrap } from '../bootstrap';
import { Session } from '../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../infrastructure/persistent-manager/pg-persistent-manager';
import { EventOutboxStorage } from '../infrastructure/event-outbox/event-outbox';
import { kysely } from '../../database/kysely';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus';
import dayjs from '../lib/dayjs';
import { TemporalWorker } from '../worker';
import { Paypal } from '../features/paypal/api/paypal';
import { config } from '../config';

const createTemporalClient = async () => {
    const connection = await Connection.connect({
        address: config.temporal.address,
    });
    return new WorkflowClient({
        connection,
        namespace: config.temporal.namespace,
    });
};

const createPaypal = () =>
    new Paypal({
        baseUrl: new URL(config.paypal.baseUrl),
        credentials: {
            clientId: config.paypal.credentials.clientId,
            clientSecret: config.paypal.credentials.clientSecret,
        },
    });

const createDomainEventsBus = () => {
    const eventOutboxStorage = EventOutboxStorage.create(kysely);

    return {
        domainEventsBus: new KafkaDomainEventsBus({
            eventOutboxStorage,
            topicPrefix: config.kafka.topicPrefix,
            forceTopicCreation: true,
            kafka: {
                global: {
                    kafkaJS: {
                        brokers: config.kafka.brokers,
                        clientId: config.kafka.clientId,
                        logLevel: 0,
                    },
                },
                producer: {},
                consumer: {
                    'group.id': config.kafka.groupId,
                },
            },
            polling: {
                interval: dayjs.duration(
                    config.outbox.pollingIntervalSeconds,
                    'seconds'
                ),
                timeout: dayjs.duration(
                    config.outbox.pollingTimeoutMinutes,
                    'minutes'
                ),
                maxDeliveryAttempts: config.outbox.maxDeliveryAttempts,
                batchSize: config.outbox.batchSize,
            },
        }),
        eventOutboxStorage,
    };
};

export const registerDependencies = async (): Promise<{
    container: Container;
    commands: Awaited<ReturnType<typeof bootstrap>>;
}> => {
    const container = new Container();

    const { domainEventsBus, eventOutboxStorage } = createDomainEventsBus();
    const temporalClient = await createTemporalClient();
    const session = new Session(
        new PersistentManager(kysely, domainEventsBus, eventOutboxStorage)
    );
    const paypal = createPaypal();

    container.register(Session, session);
    container.register(KafkaDomainEventsBus, domainEventsBus);
    container.register(EventOutboxStorage, eventOutboxStorage);
    container.register(WorkflowClient, temporalClient);
    container.register(Paypal, paypal);

    const invoicePaypalWorker = new TemporalWorker({
        temporal: {
            nativeConnectionOptions: { address: config.temporal.address },
        },
        paypal,
        session,
    });
    container.register(TemporalWorker, invoicePaypalWorker);

    const commands = await bootstrap({
        session,
        domainEventsBus,
        temporalClient,
        paypalPolling: config.paypal.polling,
        kysely,
    });

    return { container, commands };
};
