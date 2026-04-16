import { sql } from 'kysely';
import type { Kysely } from '../../../database/kysely.ts';

export const cleanDatabase = async (kysely: Kysely) => {
    await sql`
        DO $$ DECLARE t text;
        BEGIN
            FOR t IN
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename NOT LIKE 'kysely_%'
            LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(t) || ' CASCADE';
            END LOOP;
        END $$
    `.execute(kysely);
};
