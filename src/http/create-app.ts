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
        }),
        eventOutboxStorage,
    };
};

export const createApp = async () => {
    const { domainEventsBus, eventOutboxStorage } = createDomainEventsBus();
    const commands = await bootstrap({
        session: new Session(
            new PersistentManager(domainEventsBus, eventOutboxStorage)
        ),
        domainEventsBus,
    });

    await commands.start();

    const app = Fastify();

    app.setErrorHandler(errorHandler);
    app.addHook('onClose', async () => {
        await commands.shutdown();
        await kysely.destroy();
    });

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
