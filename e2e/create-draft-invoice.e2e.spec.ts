import { setupApp, expectError, resolveByPath } from './helpers';

const { postJson, postRaw } = setupApp();

describe('POST /invoices/drafts', () => {
    it('creates an empty draft invoice', async () => {
        const res = await postJson('/invoices/drafts', {});
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(
            expect.objectContaining({ status: 'DRAFT' })
        );
        expect(json.data.id).toBeDefined();
    });

    it('creates a draft invoice with line items', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '10',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.lineItems.items).toHaveLength(1);
        expect(json.data.lineItems.items[0].description).toBe('Service');
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/drafts', 'not json');
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
        for (const issue of json.error.issues) {
            expect(issue).toEqual({
                path: expect.any(Array),
                message: expect.any(String),
            });
            for (const segment of issue.path) {
                expect(['string', 'number']).toContain(typeof segment);
            }
        }
    });

    it('returns 400 for validation error', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [{ description: 'Item', price: { amount: '100' } }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
        expect(json.error.issues.length).toBeGreaterThan(0);
        for (const issue of json.error.issues) {
            expect(issue).toEqual({
                path: expect.any(Array),
                message: expect.any(String),
            });
            for (const segment of issue.path) {
                expect(['string', 'number']).toContain(typeof segment);
            }
        }
    });

    it('returns issue paths that resolve to the input object', async () => {
        const body = {
            lineItems: [{ description: 'Item', price: { amount: '100' } }],
        };
        const res = await postJson('/invoices/drafts', body);
        const json = await res.json();
        for (const issue of json.error.issues) {
            const parent = resolveByPath(body, issue.path.slice(0, -1));
            expect(parent).toBeDefined();
            expect(resolveByPath(body, issue.path)).toBeUndefined();
        }
    });

    it('returns 422 for domain error', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: 'Item',
                    price: { amount: '100', currency: 'INVALID' },
                    quantity: '1',
                },
            ],
        });
        await expectError(res, 422);
    });
});
