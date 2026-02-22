import { setupApp, COMPLETE_DRAFT_REQUEST, expectError } from './helpers';

const { post, createDraft } = setupApp();

describe('POST /invoices/drafts/:id/complete', () => {
    it('completes a fully populated draft', async () => {
        const draft = await createDraft(COMPLETE_DRAFT_REQUEST);
        const res = await post(`/invoices/drafts/${draft.id}/complete`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.status).toBe('ISSUED');
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
