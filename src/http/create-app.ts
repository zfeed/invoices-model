import Fastify from 'fastify';
import { bootstrap } from '../bootstrap';
import { Session } from '../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../infrastructure/persistent-manager/pg-persistent-manager';
import { InMemoryDomainEvents } from '../infrastructure/domain-events/in-memory-domain-events';
import { EventOutboxStorage } from '../infrastructure/event-outbox/event-outbox';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins';
import { errorHandler } from './error-handler';

export const createApp = async () => {
    const domainEvents = new InMemoryDomainEvents();
    const commands = await bootstrap({
        session: new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        ),
        domainEvents,
    });

    await commands.start();

    const app = Fastify();

    app.setErrorHandler(errorHandler);
    app.addHook('onClose', async () => {
        await commands.shutdown();
    });

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
