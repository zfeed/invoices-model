import { startTestEnvironment } from './runtime/environment.ts';
import { migrateToLatest } from './runtime/migrate.ts';
import { loadEnv } from '../src/lib/load-env/load-env.ts';

export default async function setup() {
    loadEnv('.env.test');

    const environment = await startTestEnvironment();

    Object.assign(process.env, environment.env);

    await migrateToLatest(environment.env.DATABASE_URL!);

    return async () => {
        await environment.stop();
    };
}
