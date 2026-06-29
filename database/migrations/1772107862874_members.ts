import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('members')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`uuidv7()`)
        )
        .addColumn('first_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('last_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('organization_id', 'uuid', (col) =>
            col.references('organizations.id').onDelete('restrict').notNull()
        )
        .addColumn('created_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', sql`timestamptz`, (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();

    await db.schema
        .createIndex('idx_members_organization_id')
        .on('members')
        .column('organization_id')
        .execute();
}
