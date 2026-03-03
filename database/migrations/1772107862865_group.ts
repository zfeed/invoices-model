import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('groups')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('step_id', 'uuid', (col) =>
            col.notNull().references('steps.id')
        )
        .addColumn('required_approvals', 'integer', (col) => col.notNull())
        .execute();
}
