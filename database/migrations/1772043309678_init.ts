import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createType('draft_invoice_status')
        .asEnum(['DRAFT', 'COMPLETED', 'ARCHIVED'])
        .execute();

    await db.schema
        .createType('issuer_type')
        .asEnum(['INDIVIDUAL', 'COMPANY'])
        .execute();

    await db.schema
        .createType('recipient_type')
        .asEnum(['INDIVIDUAL', 'COMPANY'])
        .execute();

    await db.schema
        .createTable('draft_invoices')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('status', sql`draft_invoice_status`, (col) => col.notNull())
        .addColumn('vat_rate', sql`numeric(5, 2)`)
        .addColumn('vat_amount', sql`numeric(78, 0)`)
        .addColumn('vat_currency', sql`char(3)`)
        .addColumn('total_amount', sql`numeric(78, 0)`)
        .addColumn('total_currency', sql`char(3)`)
        .addColumn('issue_date', 'date')
        .addColumn('due_date', 'date')
        .addColumn('issuer_type', sql`issuer_type`)
        .addColumn('issuer_name', 'varchar(255)')
        .addColumn('issuer_address', 'varchar(255)')
        .addColumn('issuer_tax_id', 'varchar(20)')
        .addColumn('issuer_email', 'varchar(320)')
        .addColumn('recipient_type', sql`recipient_type`)
        .addColumn('recipient_name', 'varchar(255)')
        .addColumn('recipient_address', 'varchar(255)')
        .addColumn('recipient_tax_id', 'varchar(20)')
        .addColumn('recipient_email', 'varchar(320)')
        .addColumn('recipient_tax_residence_country', sql`char(2)`)
        .addColumn('created_at', sql`timestamptz`, (col) => col.notNull())
        .addColumn('updated_at', sql`timestamptz`, (col) => col.notNull())
        .execute();
}
