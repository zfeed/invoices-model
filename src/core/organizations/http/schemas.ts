import { z } from 'zod';

export const createOrganizationSchema = z.object({
    name: z.string().max(255),
    member: z.object({
        firstName: z.string().max(255),
        lastName: z.string().max(255),
    }),
});
