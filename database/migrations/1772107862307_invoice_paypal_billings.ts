import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('invoice_paypal_billings')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`uuidv7()`)
        )
        .addColumn('invoice_id', 'uuid', (col) =>
            col
                .references('invoices.id')
                .onDelete('restrict')
                .notNull()
                .unique()
        )
        .addColumn('email', 'varchar(320)', (col) => col.notNull())
        .addColumn('created_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();
}
