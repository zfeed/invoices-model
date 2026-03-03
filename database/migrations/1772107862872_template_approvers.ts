import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('template_approvers')
        .addColumn('id', 'uuid', (col) => col.notNull())
        .addColumn('group_template_id', 'uuid', (col) =>
            col.notNull().references('group_templates.id')
        )
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('email', 'varchar(320)', (col) => col.notNull())
        .addPrimaryKeyConstraint('template_approvers_pkey', [
            'group_template_id',
            'id',
        ])
        .execute();
}
