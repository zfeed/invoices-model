import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('authflows')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('document_id', 'uuid', (col) =>
            col.notNull().references('documents.id')
        )
        .addColumn('action', 'varchar(255)', (col) => col.notNull())
        .addColumn('range_from_amount', sql`numeric(78, 0)`, (col) =>
            col.notNull()
        )
        .addColumn('range_from_currency', sql`char(3)`, (col) => col.notNull())
        .addColumn('range_to_amount', sql`numeric(78, 0)`, (col) =>
            col.notNull()
        )
        .addColumn('range_to_currency', sql`char(3)`, (col) => col.notNull())
        .execute();
}
