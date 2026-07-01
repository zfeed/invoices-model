import { aroundEach } from 'vitest';
import { organizationContext } from '../src/lib/organization-context/organization-context.ts';
import { createOrganization } from '../src/core/organizations/commands/create-organization.ts';
import { cleanDatabase } from '../src/platform/infrastructure/persistent-manager/clean-database.ts';
import { getTestKysely } from './kysely.ts';

aroundEach(async (runTest) => {
    const kysely = getTestKysely();

    const { organization } = await createOrganization(kysely)({
        name: 'Test Organization',
        member: { firstName: 'Test', lastName: 'Member' },
    });

    try {
        await organizationContext.run(
            { organizationId: organization.id },
            runTest
        );
    } finally {
        await cleanDatabase(kysely);
    }
});
