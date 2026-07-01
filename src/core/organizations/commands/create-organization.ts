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

            return {
                organization: {
                    id: organization.id,
                    name: organization.name,
                    createdAt: organization.created_at,
                    updatedAt: organization.updated_at,
                },
                member: {
                    id: member.id,
                    organizationId: member.organization_id,
                    firstName: member.first_name,
                    lastName: member.last_name,
                    createdAt: member.created_at,
                    updatedAt: member.updated_at,
                },
            };
        });
