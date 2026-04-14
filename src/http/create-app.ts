import Fastify from 'fastify';
import { WorkflowClient } from '@temporalio/client';
import { SpanKind, trace } from '@opentelemetry/api';
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
import { withSpan } from '../shared/tracing/with-span';

const tracer = trace.getTracer('application');

const startBootstrap = async (
    container: Container,
    temporalClient: WorkflowClient,
    invoicePaypalWorker: TemporalWorker
) => {
    const commands = await bootstrap({
        session: container.getOrThrow(Session),
        domainEventsBus: container.getOrThrow(KafkaDomainEventsBus),
        temporalClient,
        paypalPolling: config.paypal.polling,
        kysely,
    });

    await commands.start();
    void invoicePaypalWorker.start();

    return commands;
};

export const createApp = async (container?: Container) => {
    const resolvedContainer = container ?? (await registerDependencies());

    const pino = resolvedContainer.getOrThrow<PinoInstance>(Pino);
    const temporalClient =
        resolvedContainer.getOrThrow<WorkflowClient>(WorkflowClient);
    const invoicePaypalWorker =
        resolvedContainer.getOrThrow<TemporalWorker>(TemporalWorker);

    const commands = await withSpan(
        tracer,
        'bootstrap application',
        () =>
            startBootstrap(
                resolvedContainer,
                temporalClient,
                invoicePaypalWorker
            ),
        { kind: SpanKind.INTERNAL }
    );

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
