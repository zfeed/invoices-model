import { init } from './init.ts';

const { app, config } = await init();

await app.start(config.http.port);
