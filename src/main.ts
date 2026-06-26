import { init } from './platform/application/init.ts';

const { app, config } = await init();

await app.start(config.http.port);
