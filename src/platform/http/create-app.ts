import Fastify from 'fastify';
import { WorkflowClient } from '@temporalio/client';
import { SpanKind, trace } from '@opentelemetry/api';
import type { Kysely } from '../../../database/kysely.ts';
import { errorHandler } from './error-handler.ts';
import { TemporalWorker } from '../worker.ts';
import { registerDependencies } from '../container/register-dependencies.ts';
import { Container } from '../../lib/container/container.ts';
import { bootstrap } from '../../core/bootstrap.ts';
import { Session } from '../../core/building-blocks/unit-of-work/unit-of-work.ts';
import { KafkaDomainEventsBus } from '../infrastructure/domain-events/kafka/kafka-domain-events-bus.ts';
import { Config } from '../../config.ts';
import { pino as Pino, Logger as PinoInstance } from 'pino';
import { withSpan } from '../../lib/with-span/with-span.ts';
import * as plugins from './plugins.ts';

const tracer = trace.getTracer('application');

export const createApp = async (container?: Container) => {
    const resolvedContainer = container ?? (await registerDependencies());

    const pino = resolvedContainer.getOrThrow<PinoInstance>(Pino);
    const temporalClient =
        resolvedContainer.getOrThrow<WorkflowClient>(WorkflowClient);
    const invoicePaypalWorker =
        resolvedContainer.getOrThrow<TemporalWorker>(TemporalWorker);
    const config = resolvedContainer.getOrThrow<Config>('Config');
    const kysely = resolvedContainer.getOrThrow<Kysely>('Kysely');
    const session = resolvedContainer.getOrThrow<Session>(Session);
    const domainEventsBus =
        resolvedContainer.getOrThrow<KafkaDomainEventsBus>(
            KafkaDomainEventsBus
        );

    const core = await withSpan(
        tracer,
        'run core',
        async () => {
            const core = await bootstrap({
                session,
                domainEventsBus,
                temporalClient,
                paypalPolling: config.paypal.polling,
                kysely,
            });

            await core.start();

            void invoicePaypalWorker.start();

            return core;
        },
        { kind: SpanKind.INTERNAL }
    );

    const app = Fastify({
        loggerInstance: pino,
    });

    app.setErrorHandler(errorHandler);
    app.addHook('onClose', async () => {
        await invoicePaypalWorker.shutdown();
        await core.shutdown();
        await temporalClient.connection.close();
        await kysely.destroy();
    });

    plugins.init(app as any, core);

    return app;
};
