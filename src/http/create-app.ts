import Fastify from 'fastify';
import { bootstrap } from '../bootstrap';
import { Session } from '../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../infrastructure/persistent-manager/pg-persistent-manager';
import { EventOutboxStorage } from '../infrastructure/event-outbox/event-outbox';
import { kysely } from '../../database/kysely';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins';
import { errorHandler } from './error-handler';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus';
import dayjs from '../lib/dayjs';
import { Connection, WorkflowClient } from '@temporalio/client';
import { TemporalWorker } from '../worker';
import { Paypal } from '../features/paypal/api/paypal';

const temporalAddress = () => process.env.TEMPORAL_ADDRESS || 'localhost:7233';

const createTemporalClient = async () => {
    const connection = await Connection.connect({
        address: temporalAddress(),
    });
    return new WorkflowClient({
        connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });
};

const createPaypal = () =>
    new Paypal({
        baseUrl: new URL(
            process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
        ),
        credentials: {
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        },
    });

const readPollingConfig = () => ({
    maxAttempts: Number(process.env.PAYPAL_POLL_MAX_ATTEMPTS || 8),
    initialDelayMs: Number(process.env.PAYPAL_POLL_INITIAL_DELAY_MS || 5000),
    factor: Number(process.env.PAYPAL_POLL_FACTOR || 2),
});

const createDomainEventsBus = () => {
    const eventOutboxStorage = EventOutboxStorage.create(kysely);

    return {
        domainEventsBus: new KafkaDomainEventsBus({
            eventOutboxStorage,
            topicPrefix: process.env.KAFKA_TOPIC_PREFIX,
            forceTopicCreation: true,
            kafka: {
                global: {
                    kafkaJS: {
                        brokers: process.env.KAFKA_BROKERS?.split(',') || [],
                        clientId:
                            process.env.KAFKA_CLIENT_ID || 'invoices-model',
                        logLevel: 0,
                    },
                },
                producer: {},
                consumer: {
                    'group.id': process.env.KAFKA_GROUP_ID || 'invoices-model',
                },
            },
            polling: {
                interval: dayjs.duration(
                    Number(process.env.OUTBOX_POLLING_INTERVAL_S || 30),
                    'seconds'
                ),
                timeout: dayjs.duration(
                    Number(process.env.OUTBOX_POLLING_TIMEOUT_M || 5),
                    'minutes'
                ),
                maxDeliveryAttempts: Number(
                    process.env.OUTBOX_MAX_DELIVERY_ATTEMPTS || 10
                ),
                batchSize: Number(process.env.OUTBOX_BATCH_SIZE || 10),
            },
        }),
        eventOutboxStorage,
    };
};

export const createApp = async () => {
    const { domainEventsBus, eventOutboxStorage } = createDomainEventsBus();

    const temporalClient = await createTemporalClient();

    const session = new Session(
        new PersistentManager(kysely, domainEventsBus, eventOutboxStorage)
    );

    const commands = await bootstrap({
        session,
        domainEventsBus,
        temporalClient,
        paypalPolling: readPollingConfig(),
        kysely,
    });

    await commands.start();

    const invoicePaypalWorker = new TemporalWorker({
        temporal: { nativeConnectionOptions: { address: temporalAddress() } },
        paypal: createPaypal(),
        session,
    });
    void invoicePaypalWorker.start();

    const app = Fastify();

    app.setErrorHandler(errorHandler);
    app.addHook('onClose', async () => {
        await invoicePaypalWorker.shutdown();
        await commands.shutdown();
        await temporalClient.connection.close();
        await kysely.destroy();
    });

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
