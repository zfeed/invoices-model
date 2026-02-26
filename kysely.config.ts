import 'dotenv/config';
import { defineConfig } from 'kysely-ctl';
import { postgresDialect } from './database/kysely';

export default defineConfig({
    dialect: postgresDialect,
    migrations: {
        migrationFolder: 'database/migrations',
    },
    seeds: {
        seedFolder: 'database/seeds',
    },
});
