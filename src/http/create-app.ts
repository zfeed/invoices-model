import Fastify from 'fastify';
import { bootstrap } from '../core/bootstrap';
import { Session } from '../core/shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../infrastructure/persistent-manager/persistent-manager';
import { InMemoryDomainEvents } from '../infrastructure/domain-events/in-memory-domain-events';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins';
import { errorHandler } from './error-handler';

export const createApp = async () => {
    const domainEvents = new InMemoryDomainEvents();
    const commands = await bootstrap({
        session: new Session({
            storage: new PersistentManager(domainEvents),
            maxRetries: 5,
        }),
        domainEvents,
    });

    const app = Fastify();

    app.setErrorHandler(errorHandler);

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
