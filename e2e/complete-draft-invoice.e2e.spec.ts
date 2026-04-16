import {
    setupApp,
    COMPLETE_DRAFT_REQUEST,
    expectError,
    INVOICE_SHAPE,
} from './helpers.ts';

const { post, createDraft } = setupApp();

describe('POST /invoices/drafts/:id/complete', () => {
    it('completes a fully populated draft', async () => {
        const draft = await createDraft(COMPLETE_DRAFT_REQUEST);
        const res = await post(`/invoices/drafts/${draft.id}/complete`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(INVOICE_SHAPE);
        expect(json.data.status).toBe('ISSUED');
        expect(json.data.id).toEqual(expect.any(String));
        expect(json.data.lineItems).toHaveLength(1);
        expect(json.data.issueDate).toBe('2025-01-01');
        expect(json.data.dueDate).toBe('2025-02-01');
    });

    it('returns 422 for incomplete draft', async () => {
        const draft = await createDraft();
        const res = await post(`/invoices/drafts/${draft.id}/complete`);
        await expectError(res, 422);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await post('/invoices/drafts/non-existent-id/complete');
        await expectError(res, 422);
    });
});
