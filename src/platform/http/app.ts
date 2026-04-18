import '../../instrumentation.ts';
import { SpanKind, trace } from '@opentelemetry/api';
import { createApp } from './create-app.ts';
import { registerDependencies } from '../container/register-dependencies.ts';
import { Logger } from '../../core/building-blocks/logger/logger.ts';
import { withSpan } from '../../lib/with-span/with-span.ts';
import { Config } from '../../config.ts';

const tracer = trace.getTracer('application');

type App = Awaited<ReturnType<typeof createApp>>;

const shutdown = async (signal: string, app: App, logger: Logger) => {
    logger.info(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
};

const startup = async () => {
    const container = await withSpan(tracer, 'register dependencies', () =>
        registerDependencies()
    );

    const logger = container.getOrThrow<Logger>(Logger);
    const config = container.getOrThrow<Config>('Config');
    const app = await createApp(container);

    process.on('SIGTERM', () => shutdown('SIGTERM', app, logger));
    process.on('SIGINT', () => shutdown('SIGINT', app, logger));

    const address = await withSpan(
        tracer,
        'listen application',
        () => app.listen({ port: config.http.port }),
        {
            kind: SpanKind.INTERNAL,
            attributes: { 'server.port': config.http.port },
        }
    );

    logger.info(`Server running on ${address}`);
};

withSpan(tracer, 'start application', startup, {
    kind: SpanKind.INTERNAL,
}).catch((error: unknown) => {
    process.stderr.write(`Failed to start application: ${String(error)}\n`);
    process.exit(1);
});
