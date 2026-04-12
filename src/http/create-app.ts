import Fastify from 'fastify';
import { WorkflowClient } from '@temporalio/client';
import { kysely } from '../../database/kysely';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins';
import { errorHandler } from './error-handler';
import { TemporalWorker } from '../worker';
import { registerDependencies } from '../container/register-dependencies';
import { Container } from '../container/container';
import { bootstrap } from '../bootstrap';
import { Session } from '../shared/unit-of-work/unit-of-work';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus';
import { config } from '../config';
import { pino as Pino, Logger as PinoInstance } from 'pino';

export const createApp = async (container?: Container) => {
    container = container ?? (await registerDependencies());

    const pino = container.getOrThrow<PinoInstance>(Pino);
    const temporalClient = container.getOrThrow<WorkflowClient>(WorkflowClient);
    const invoicePaypalWorker =
        container.getOrThrow<TemporalWorker>(TemporalWorker);

    const commands = await bootstrap({
        session: container.getOrThrow(Session),
        domainEventsBus: container.getOrThrow(KafkaDomainEventsBus),
        temporalClient,
        paypalPolling: config.paypal.polling,
        kysely,
    });

    await commands.start();
    void invoicePaypalWorker.start();

    const app = Fastify({
        loggerInstance: pino,
    });

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
