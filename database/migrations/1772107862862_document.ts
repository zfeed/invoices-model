import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('documents')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('reference_id', 'varchar(255)', (col) => col.notNull())
        .addColumn('value_amount', sql`numeric(78, 0)`, (col) => col.notNull())
        .addColumn('value_currency', sql`char(3)`, (col) => col.notNull())
        .execute();
}
