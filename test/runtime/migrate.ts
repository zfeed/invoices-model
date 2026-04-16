import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import {
    FileMigrationProvider,
    Kysely,
    Migrator,
    PostgresDialect,
} from 'kysely';
import { register } from 'tsx/esm/api';

register();

export const migrateToLatest = async (databaseUrl: string): Promise<void> => {
    const db = new Kysely<unknown>({
        dialect: new PostgresDialect({
            pool: new Pool({ connectionString: databaseUrl }),
        }),
    });

    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.resolve('database/migrations'),
        }),
    });

    try {
        const { error, results } = await migrator.migrateToLatest();

        for (const result of results ?? []) {
            if (result.status === 'Error') {
                throw new Error(`Migration failed: ${result.migrationName}`);
            }
        }

        if (error) {
            throw error instanceof Error ? error : new Error(String(error));
        }
    } finally {
        await db.destroy();
    }
};
