import { App } from './app.ts';
import { sdk as otelSdk } from '../../instrumentation.ts';

import { registerDependencies } from '../container/register-dependencies.ts';

import { WorkflowClient } from '@temporalio/client';
import type { Kysely } from '../../../database/kysely.ts';
import { TemporalWorker } from '../worker.ts';
import { bootstrap } from '../../core/bootstrap.ts';
import { Session } from '../../core/building-blocks/unit-of-work/unit-of-work.ts';
import { PgBossDomainEventsBus } from '../infrastructure/domain-events/pg-boss/pg-boss-domain-events-bus.ts';
import { Config } from '../../config.ts';
import { pino as Pino, Logger as PinoInstance } from 'pino';
import { errorHandler } from '../http/error-handler.ts';
import * as plugins from '../http/plugins.ts';

export async function init() {
    const container = await registerDependencies();

    const pino = container.getOrThrow<PinoInstance>(Pino);
    const temporalClient = container.getOrThrow<WorkflowClient>(WorkflowClient);
    const invoicePaypalWorker =
        container.getOrThrow<TemporalWorker>(TemporalWorker);
    const config = container.getOrThrow<Config>('Config');
    const kysely = container.getOrThrow<Kysely>('Kysely');
    const session = container.getOrThrow<Session>(Session);
    const domainEventsBus = container.getOrThrow<PgBossDomainEventsBus>(
        PgBossDomainEventsBus
    );

    const app = new App({
        logger: pino as any,
        errorHandler,
    });

    app.onBootstrap(async () => {
        const core = bootstrap({
            session,
            domainEventsBus,
            temporalClient,
            paypalPolling: config.paypal.polling,
            kysely,
        });

        await core.start();

        void invoicePaypalWorker.start();

        plugins.init(app.http as any, core);

        app.onShutdown(async () => {
            await invoicePaypalWorker.shutdown();
            await core.shutdown();
            await temporalClient.connection.close();
            await kysely.destroy();
            await otelSdk.shutdown();
        });
    });

    return { app, config };
}
