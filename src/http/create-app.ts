import Fastify from 'fastify';
import { WorkflowClient } from '@temporalio/client';
import { SpanKind, trace } from '@opentelemetry/api';
import { kysely } from '../../database/kysely.ts';
import {
    draftInvoicesPlugin,
    invoicesPlugin,
    financialAuthorizationPlugin,
} from './plugins/index.ts';
import { errorHandler } from './error-handler.ts';
import { TemporalWorker } from '../worker.ts';
import { registerDependencies } from '../container/register-dependencies.ts';
import { Container } from '../container/container.ts';
import { bootstrap } from '../bootstrap.ts';
import { Session } from '../shared/unit-of-work/unit-of-work.ts';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus.ts';
import { config } from '../config.ts';
import { pino as Pino, Logger as PinoInstance } from 'pino';
import { withSpan } from '../shared/tracing/with-span.ts';

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
