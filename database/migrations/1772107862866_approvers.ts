import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('approvers')
        .addColumn('id', 'uuid', (col) => col.notNull())
        .addColumn('group_id', 'uuid', (col) =>
            col.notNull().references('groups.id')
        )
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('email', 'varchar(320)', (col) => col.notNull())
        .addPrimaryKeyConstraint('approvers_pkey', ['group_id', 'id'])
        .execute();
}
