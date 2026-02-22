import { setupApp, expectError } from './helpers';

const { putJson, putRaw, createDraft } = setupApp();

describe('PUT /invoices/drafts/:id', () => {
    it('updates a draft invoice', async () => {
        const draft = await createDraft();
        const res = await putJson(`/invoices/drafts/${draft.id}`, {
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
            ],
            vatRate: '20',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.lineItems.items).toHaveLength(1);
        expect(json.data.lineItems.items[0].description).toBe('Consulting');
    });

    it('updates with empty body', async () => {
        const draft = await createDraft();
        const res = await putJson(`/invoices/drafts/${draft.id}`, {});
        expect(res.status).toBe(200);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await putJson('/invoices/drafts/non-existent-id', {});
        await expectError(res, 422);
    });

    it('returns 400 for invalid JSON', async () => {
        const draft = await createDraft();
        const res = await putRaw(`/invoices/drafts/${draft.id}`, 'not json');
        await expectError(res, 400, 'Invalid JSON');
    });
});
