import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('policies')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('action', 'varchar(255)', (col) => col.notNull())
        .execute();
}
