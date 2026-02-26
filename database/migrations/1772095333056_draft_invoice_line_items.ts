import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('draft_invoice_line_items')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`uuidv7()`)
        )
        .addColumn('draft_invoice_id', 'uuid', (col) =>
            col.references('draft_invoices.id').onDelete('restrict').notNull()
        )
        .addColumn('description', 'varchar', (col) => col.notNull())
        .addColumn('price_amount', sql`numeric(78, 0)`, (col) => col.notNull())
        .addColumn('price_currency', sql`char(3)`, (col) => col.notNull())
        .addColumn('quantity', 'bigint', (col) => col.notNull())
        .addColumn('total_amount', sql`numeric(78, 0)`, (col) => col.notNull())
        .addColumn('total_currency', sql`char(3)`, (col) => col.notNull())
        .addColumn('created_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();

    await db.schema
        .createIndex('idx_draft_invoice_line_items_invoice_id')
        .on('draft_invoice_line_items')
        .column('draft_invoice_id')
        .execute();
}
