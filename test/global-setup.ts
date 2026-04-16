import { startTestEnvironment } from './runtime/environment';
import { migrateToLatest } from './runtime/migrate';

export default async function setup() {
    const environment = await startTestEnvironment();

    Object.assign(process.env, environment.env);

    await migrateToLatest(environment.env.DATABASE_URL!);

    return async () => {
        await environment.stop();
    };
}
