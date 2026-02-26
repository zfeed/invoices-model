import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from 'kysely-codegen';

export const postgresDialect = new PostgresDialect({
    pool: new Pool({
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    }),
});

export const kysely = new Kysely<DB>({
    dialect: postgresDialect,
});

kysely.selectFrom('draft_invoices').selectAll().execute();
