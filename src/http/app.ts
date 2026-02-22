import { serve } from '@hono/node-server';
import { createApp } from './create-app';

const main = async () => {
    const app = await createApp();

    serve({ fetch: app.fetch, port: 3000 }, (info) => {
        console.log(`Server running on http://localhost:${info.port}`);
    });
};

main();
