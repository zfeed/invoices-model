import { setupApp, tooLong, expectValidationError } from './helpers.ts';

const { postJson, postRaw } = setupApp();

describe('POST /organizations', () => {
    it('creates an organization with its first member', async () => {
        const res = await postJson('/organizations', {
            name: 'Acme',
            member: { firstName: 'Ada', lastName: 'Lovelace' },
        });

        expect(res.status).toBe(200);
        const json = await res.json();

        expect(json.data.organization).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                name: 'Acme',
            })
        );
        expect(json.data.member).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                first_name: 'Ada',
                last_name: 'Lovelace',
                organization_id: json.data.organization.id,
            })
        );
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/organizations', 'not json');
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
    });

    it('returns 400 when member is missing', async () => {
        const res = await postJson('/organizations', { name: 'Acme' });
        await expectValidationError(res, ['member']);
    });

    it('returns 400 when name exceeds max length', async () => {
        const res = await postJson('/organizations', {
            name: tooLong(255),
            member: { firstName: 'Ada', lastName: 'Lovelace' },
        });
        await expectValidationError(res, ['name']);
    });

    it('returns 400 when member names exceed max length', async () => {
        const res = await postJson('/organizations', {
            name: 'Acme',
            member: { firstName: tooLong(255), lastName: tooLong(255) },
        });
        await expectValidationError(
            res,
            ['member', 'firstName'],
            ['member', 'lastName']
        );
    });
});
