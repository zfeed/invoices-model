import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('step_templates')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('template_id', 'uuid', (col) =>
            col.notNull().references('templates.id')
        )
        .addColumn('order', 'integer', (col) => col.notNull())
        .execute();
}
