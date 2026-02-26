import Fastify from 'fastify';
import { bootstrap } from '../core/bootstrap';
import { UnitOfWorkFactory } from '../infrastructure/unit-of-work/unit-of-work-factory';
import { InMemoryDomainEvents } from '../infrastructure/domain-events/in-memory-domain-events';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins';
import { errorHandler } from './error-handler';

export const createApp = async () => {
    const commands = await bootstrap({
        unitOfWorkFactory: new UnitOfWorkFactory(),
        domainEvents: new InMemoryDomainEvents(),
    });

    const app = Fastify();

    app.setErrorHandler(errorHandler);

    app.register(draftInvoicesPlugin(commands));
    app.register(invoicesPlugin(commands));
    app.register(financialAuthorizationPlugin(commands));

    return app;
};
