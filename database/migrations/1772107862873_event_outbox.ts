import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('event_outbox')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`uuidv7()`)
        )
        .addColumn('event_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('payload', 'jsonb', (col) => col.notNull())
        .addColumn('created_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('delivered_at', sql`timestamptz`)
        .addColumn('delivery_attempts', 'integer', (col) =>
            col.notNull().defaultTo(0)
        )
        .addColumn('last_attempted_at', sql`timestamptz`)
        .execute();
}
