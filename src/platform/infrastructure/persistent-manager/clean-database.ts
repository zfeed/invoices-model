import { sql } from 'kysely';
import type { Kysely } from '../../../../database/kysely.ts';

export const cleanDatabase = async (kysely: Kysely) => {
    await sql`
        DO $$ DECLARE r record;
        BEGIN
            FOR r IN
                SELECT schemaname, tablename FROM pg_tables
                WHERE (schemaname = 'public' AND tablename NOT LIKE 'kysely_%')
                   OR schemaname = 'pgboss'
            LOOP
                EXECUTE 'TRUNCATE TABLE '
                    || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename)
                    || ' CASCADE';
            END LOOP;
        END $$
    `.execute(kysely);
};
