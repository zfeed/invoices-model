import { setupApp, expectError } from './helpers';

const { postJson, postRaw } = setupApp();

describe('POST /invoices/drafts/calculate', () => {
    it('calculates totals for a draft invoice', async () => {
        const res = await postJson('/invoices/drafts/calculate', {
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '3',
                },
            ],
            vatRate: '10',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.lineItems.subtotal).toEqual({
            amount: '600',
            currency: 'USD',
        });
        expect(json.data.vatAmount).toEqual({
            amount: '60',
            currency: 'USD',
        });
        expect(json.data.total).toEqual({
            amount: '660',
            currency: 'USD',
        });
    });

    it('calculates with empty body', async () => {
        const res = await postJson('/invoices/drafts/calculate', {});
        expect(res.status).toBe(200);
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/drafts/calculate', 'not json');
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

    it('returns 422 for domain error', async () => {
        const res = await postJson('/invoices/drafts/calculate', {
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
