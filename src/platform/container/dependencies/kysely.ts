import { Pool } from 'pg';
import { Kysely as BaseKysely, PostgresDialect } from 'kysely';
import { DB } from 'kysely-codegen';
import { Config } from '../../../config.ts';
import type { Kysely } from '../../../../database/kysely.ts';

export const createKysely = (config: Config): Kysely =>
    new BaseKysely<DB>({
        dialect: new PostgresDialect({
            pool: new Pool({ connectionString: config.database.url }),
        }),
    });
