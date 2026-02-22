import { setupApp, expectError } from './helpers';

const { postJson, postRaw, createDraft } = setupApp();

describe('POST /invoices/drafts/:id/update', () => {
    it('updates a draft invoice', async () => {
        const draft = await createDraft();
        const res = await postJson(`/invoices/drafts/${draft.id}/update`, {
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
        const res = await postJson(`/invoices/drafts/${draft.id}/update`, {});
        expect(res.status).toBe(200);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await postJson(
            '/invoices/drafts/non-existent-id/update',
            {}
        );
        await expectError(res, 422);
    });

    it('returns 400 for invalid JSON', async () => {
        const draft = await createDraft();
        const res = await postRaw(
            `/invoices/drafts/${draft.id}/update`,
            'not json'
        );
        await expectError(res, 400, 'Invalid JSON');
    });
});
