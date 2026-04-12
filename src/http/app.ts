import '../instrumentation';
import 'dotenv/config';
import { createApp } from './create-app';
import { registerDependencies } from '../container/register-dependencies';
import { Logger } from '../shared/logger/logger';

const main = async () => {
    const container = await registerDependencies();
    const logger = container.getOrThrow<Logger>(Logger);
    const app = await createApp(container);

    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}, shutting down...`);
        await app.close();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    app.listen({ port: 3000 }, (err, address) => {
        if (err) {
            logger.error('Failed to start server', { err: err.message });
            process.exit(1);
        }
        logger.info(`Server running on ${address}`);
    });
};

main();
