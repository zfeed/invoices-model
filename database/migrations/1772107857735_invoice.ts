import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createType('invoice_status')
        .asEnum(['ISSUED', 'PROCESSING', 'CANCELLED', 'PAID', 'FAILED'])
        .execute();

    await db.schema
        .createTable('invoices')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('status', sql`invoice_status`, (col) => col.notNull())
        .addColumn('vat_rate', sql`numeric(5, 2)`)
        .addColumn('vat_amount', sql`numeric(78, 0)`)
        .addColumn('vat_currency', sql`char(3)`)
        .addColumn('total_amount', sql`numeric(78, 0)`, (col) => col.notNull())
        .addColumn('total_currency', sql`char(3)`, (col) => col.notNull())
        .addColumn('issue_date', 'date', (col) => col.notNull())
        .addColumn('due_date', 'date', (col) => col.notNull())
        .addColumn('issuer_type', sql`issuer_type`, (col) => col.notNull())
        .addColumn('issuer_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('issuer_address', 'varchar(255)', (col) => col.notNull())
        .addColumn('issuer_tax_id', 'varchar(20)', (col) => col.notNull())
        .addColumn('issuer_email', 'varchar(320)', (col) => col.notNull())
        .addColumn('recipient_type', sql`recipient_type`, (col) =>
            col.notNull()
        )
        .addColumn('recipient_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('recipient_address', 'varchar(255)', (col) => col.notNull())
        .addColumn('recipient_tax_id', 'varchar(20)', (col) => col.notNull())
        .addColumn('recipient_email', 'varchar(320)', (col) => col.notNull())
        .addColumn('recipient_tax_residence_country', sql`char(2)`, (col) =>
            col.notNull()
        )
        .addColumn('created_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();
}
