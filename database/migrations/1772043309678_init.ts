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
        .createType('billing_type')
        .asEnum(['PAYPAL', 'WIRE'])
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
        .addColumn('billing_type', sql`billing_type`)
        .addColumn('billing_data', 'jsonb')
        .addColumn('created_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();

    await db.schema
        .createTable('draft_invoice_line_items')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('draft_invoice_id', 'uuid', (col) =>
            col.references('draft_invoices.id').onDelete('cascade').notNull()
        )
        .addColumn('description', 'varchar', (col) => col.notNull())
        .addColumn('price_amount', 'varchar', (col) => col.notNull())
        .addColumn('price_currency', 'varchar', (col) => col.notNull())
        .addColumn('quantity', 'varchar', (col) => col.notNull())
        .addColumn('total_amount', 'varchar', (col) => col.notNull())
        .addColumn('total_currency', 'varchar', (col) => col.notNull())
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

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('draft_invoice_line_items').execute();
    await db.schema.dropTable('draft_invoices').execute();
    await db.schema.dropType('billing_type').execute();
    await db.schema.dropType('recipient_type').execute();
    await db.schema.dropType('issuer_type').execute();
    await db.schema.dropType('draft_invoice_status').execute();
}
