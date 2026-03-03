import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('steps')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('authflow_id', 'uuid', (col) =>
            col.notNull().references('authflows.id')
        )
        .addColumn('order', 'integer', (col) => col.notNull())
        .execute();
}
