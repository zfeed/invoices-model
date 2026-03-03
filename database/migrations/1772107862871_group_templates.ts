import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('group_templates')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('step_template_id', 'uuid', (col) =>
            col.notNull().references('step_templates.id')
        )
        .addColumn('required_approvals', 'integer', (col) => col.notNull())
        .execute();
}
