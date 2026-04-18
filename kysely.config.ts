import { loadEnv } from './src/load-env.ts';
import { defineConfig } from 'kysely-ctl';
import { Pool } from 'pg';
import { PostgresDialect } from 'kysely';
import { getConfig } from './src/config.ts';

loadEnv('.env');

const config = getConfig();

export default defineConfig({
    dialect: new PostgresDialect({
        pool: new Pool({ connectionString: config.database.url }),
    }),
    migrations: {
        migrationFolder: 'database/migrations',
    },
    seeds: {
        seedFolder: 'database/seeds',
    },
});
