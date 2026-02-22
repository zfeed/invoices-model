import { setupApp, expectError } from './helpers';

const { postJson, postRaw } = setupApp();

describe('POST /invoices/drafts', () => {
    it('creates an empty draft invoice', async () => {
        const res = await postJson('/invoices/drafts', {});
        expect(res.status).toBe(201);
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
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.data.lineItems.items).toHaveLength(1);
        expect(json.data.lineItems.items[0].description).toBe('Service');
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/drafts', 'not json');
        await expectError(res, 400, 'Invalid JSON');
    });

    it('returns 400 for validation error', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [{ description: 'Item', price: { amount: '100' } }],
        });
        await expectError(res, 400, 'Validation failed');
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
