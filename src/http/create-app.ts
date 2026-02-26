import Fastify from 'fastify';
import { bootstrap } from '../core/bootstrap';
import { Session } from '../infrastructure/unit-of-work/session';
import { Storage } from '../infrastructure/unit-of-work/storage/storage';
import { InMemoryDomainEvents } from '../infrastructure/domain-events/in-memory-domain-events';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins';
import { errorHandler } from './error-handler';

export const createApp = async () => {
    const commands = await bootstrap({
        session: new Session({ storage: new Storage(), maxRetries: 5 }),
        domainEvents: new InMemoryDomainEvents(),
    });

    const app = Fastify();

    app.setErrorHandler(errorHandler);

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
