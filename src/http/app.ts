import '../instrumentation';
import { SpanKind, trace } from '@opentelemetry/api';
import { createApp } from './create-app.ts';
import { registerDependencies } from '../container/register-dependencies.ts';
import { Logger } from '../shared/logger/logger.ts';
import { withSpan } from '../shared/tracing/with-span.ts';

const tracer = trace.getTracer('application');

const PORT = 3000;

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
    const app = await createApp(container);

    process.on('SIGTERM', () => shutdown('SIGTERM', app, logger));
    process.on('SIGINT', () => shutdown('SIGINT', app, logger));

    const address = await withSpan(
        tracer,
        'listen application',
        () => app.listen({ port: PORT }),
        { kind: SpanKind.INTERNAL, attributes: { 'server.port': PORT } }
    );

    logger.info(`Server running on ${address}`);
};

withSpan(tracer, 'start application', startup, {
    kind: SpanKind.INTERNAL,
    attributes: { 'server.port': PORT },
}).catch((error: unknown) => {
    process.stderr.write(`Failed to start application: ${String(error)}\n`);
    process.exit(1);
});
