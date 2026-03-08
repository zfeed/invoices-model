import { Pool } from 'pg';
import { Kysely as BaseKysely, PostgresDialect } from 'kysely';
import type {
    Transaction as BaseTransaction,
    ControlledTransaction as BaseControlledTransaction,
} from 'kysely';
import { DB } from 'kysely-codegen';

export const postgresDialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
});

export const kysely = new BaseKysely<DB>({
    dialect: postgresDialect,
});

export type Kysely = BaseKysely<DB>;
export type Transaction = BaseTransaction<DB>;
export type ControlledTransaction = BaseControlledTransaction<DB>;
