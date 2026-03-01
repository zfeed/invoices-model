import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type {
    Transaction as BaseTransaction,
    ControlledTransaction as BaseControlledTransaction,
} from 'kysely';
import { DB } from 'kysely-codegen';

console.log(process.env.POSTGRES_HOST);

export const postgresDialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
});

export const kysely = new Kysely<DB>({
    dialect: postgresDialect,
});

export type Transaction = BaseTransaction<DB>;
export type ControlledTransaction = BaseControlledTransaction<DB>;
