import { createApp } from './create-app';

const main = async () => {
    const app = await createApp();

    const shutdown = async (signal: string) => {
        console.log(`Received ${signal}, shutting down...`);
        await app.close();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    app.listen({ port: 3000 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server running on ${address}`);
    });
};

main();
