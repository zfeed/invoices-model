import { inject } from 'vitest';

const baseUrl = inject('e2eBaseUrl');
const organizationId = inject('e2eOrganizationId');
const memberId = inject('e2eMemberId');

const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

const createDraft = (headers: Record<string, string>) =>
    fetch(`${baseUrl}/invoices/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({}),
    });

describe('request authentication', () => {
    it('allows a request whose member belongs to the organization', async () => {
        const res = await createDraft({
            'x-organization-id': organizationId,
            'x-member-id': memberId,
        });

        expect(res.status).toBe(200);
    });

    it('returns 401 when headers are missing', async () => {
        const res = await createDraft({});

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json).toEqual({ error: { message: 'Unauthorized' } });
    });

    it('returns 401 when the member does not belong to the organization', async () => {
        const res = await createDraft({
            'x-organization-id': UNKNOWN_UUID,
            'x-member-id': memberId,
        });

        expect(res.status).toBe(401);
    });

    it('returns 401 when an id is not a valid uuid', async () => {
        const res = await createDraft({
            'x-organization-id': 'not-a-uuid',
            'x-member-id': memberId,
        });

        expect(res.status).toBe(401);
    });

    it('does not require authentication to create an organization', async () => {
        const res = await fetch(`${baseUrl}/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Open Org',
                member: { firstName: 'No', lastName: 'Auth' },
            }),
        });

        expect(res.status).toBe(200);
    });
});
