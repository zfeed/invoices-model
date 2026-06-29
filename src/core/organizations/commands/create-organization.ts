import type { Kysely } from '../../../../database/kysely.ts';

type CreateOrganizationInput = {
    name: string;
    member: {
        firstName: string;
        lastName: string;
    };
};

export const createOrganization =
    (kysely: Kysely) => (input: CreateOrganizationInput) =>
        kysely.transaction().execute(async (tx) => {
            const organization = await tx
                .insertInto('organizations')
                .values({ name: input.name })
                .returningAll()
                .executeTakeFirstOrThrow();

            const member = await tx
                .insertInto('members')
                .values({
                    organization_id: organization.id,
                    first_name: input.member.firstName,
                    last_name: input.member.lastName,
                })
                .returningAll()
                .executeTakeFirstOrThrow();

            return { organization, member };
        });
