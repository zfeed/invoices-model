import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('approvals')
        .addColumn('group_id', 'uuid', (col) =>
            col.notNull().references('groups.id')
        )
        .addColumn('approver_id', 'uuid', (col) => col.notNull())
        .addColumn('created_at', sql`timestamptz`, (col) => col.notNull())
        .addColumn('comment', 'text')
        .execute();
}
