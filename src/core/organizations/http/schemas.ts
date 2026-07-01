import { z } from 'zod';

export const createOrganizationSchema = z.object({
    name: z.string().max(255),
    member: z.object({
        firstName: z.string().max(255),
        lastName: z.string().max(255),
    }),
});

export const createOrganizationResponseSchema = z.object({
    organization: z
        .object({
            id: z.string(),
            name: z.string(),
        })
        .loose(),
    member: z
        .object({
            id: z.string(),
            organization_id: z.string(),
            first_name: z.string(),
            last_name: z.string(),
        })
        .loose(),
});
