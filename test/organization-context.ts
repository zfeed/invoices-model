import { aroundEach } from 'vitest';
import { organizationContext } from '../src/lib/organization-context/organization-context.ts';
import { cleanDatabase } from '../src/platform/infrastructure/persistent-manager/clean-database.ts';
import { getTestKysely } from './kysely.ts';

aroundEach(async (runTest) => {
    const kysely = getTestKysely();

    const organization = await kysely
        .insertInto('organizations')
        .values({ name: 'Test Organization' })
        .returning('id')
        .executeTakeFirstOrThrow();

    try {
        await organizationContext.run(
            { organizationId: organization.id },
            runTest
        );
    } finally {
        await cleanDatabase(kysely);
    }
});
