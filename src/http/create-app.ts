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
import PgBoss from 'pg-boss';
import { AsyncPaypal } from '../features/paypal/async/paypal';
import dayjs from '../lib/dayjs';

const createDomainEventsBus = () => {
    const eventOutboxStorage = EventOutboxStorage.create();

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

    const boss = new PgBoss(process.env.DATABASE_URL!);
    await boss.start();

    const paypal = new AsyncPaypal(boss, domainEventsBus, {
        baseUrl: new URL(process.env.PAYPAL_BASE_URL!),
        credentials: {
            clientId: process.env.PAYPAL_CLIENT_ID!,
            clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
        },
    });
    await paypal.payouts.register();

    const commands = await bootstrap({
        session: new Session(
            new PersistentManager(domainEventsBus, eventOutboxStorage)
        ),
        domainEventsBus,
        payouts: paypal.payouts,
    });

    await commands.start();

    const app = Fastify();

    app.setErrorHandler(errorHandler);
    app.addHook('onClose', async () => {
        await commands.shutdown();
        await boss.stop();
        await kysely.destroy();
    });

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
