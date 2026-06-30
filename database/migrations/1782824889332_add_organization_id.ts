import type { Kysely } from 'kysely';
import { sql } from 'kysely';

const TABLES = [
    'draft_invoices',
    'draft_invoice_paypal_billings',
    'draft_invoice_line_items',
    'invoices',
    'invoice_paypal_billings',
    'invoice_line_items',
    'documents',
    'authflows',
    'steps',
    'groups',
    'approvers',
    'approvals',
    'policies',
    'templates',
    'step_templates',
    'group_templates',
    'template_approvers',
] as const;

export async function up(db: Kysely<any>): Promise<void> {
    for (const table of TABLES) {
        await db.schema
            .alterTable(table)
            .addColumn('organization_id', 'uuid', (col) =>
                col
                    .references('organizations.id')
                    .onDelete('restrict')
                    .notNull()
            )
            .execute();

        await db.schema
            .createIndex(`idx_${table}_organization_id`)
            .on(table)
            .column('organization_id')
            .execute();
    }
}

export async function down(db: Kysely<any>): Promise<void> {
    for (const table of TABLES) {
        await db.schema
            .alterTable(table)
            .dropColumn('organization_id')
            .execute();
    }
}
