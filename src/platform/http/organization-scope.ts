import { z } from 'zod';
import { ORGANIZATION_HEADER, MEMBER_HEADER } from './authentication.ts';

// Headers that identify the organization scope a request operates within.
// Documented as request headers (not auth) and shared across all scoped routes.
export const organizationScopeHeaders = z.object({
    [ORGANIZATION_HEADER]: z
        .string()
        .describe('Organization the request is scoped to (UUID).'),
    [MEMBER_HEADER]: z
        .string()
        .describe('Member making the request within the organization (UUID).'),
});
