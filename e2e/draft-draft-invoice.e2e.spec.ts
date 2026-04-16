import { setupApp, expectError, EMPTY_DRAFT_SHAPE } from './helpers.ts';

const { post, createDraft } = setupApp();

describe('POST /invoices/drafts/:id/draft', () => {
    it('moves an archived draft back to draft', async () => {
        const draft = await createDraft();
        await post(`/invoices/drafts/${draft.id}/archive`);
        const res = await post(`/invoices/drafts/${draft.id}/draft`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual({ ...EMPTY_DRAFT_SHAPE, id: draft.id });
        expect(json.data.status).toBe('DRAFT');
    });

    it('returns 422 for non-archived draft', async () => {
        const draft = await createDraft();
        const res = await post(`/invoices/drafts/${draft.id}/draft`);
        await expectError(res, 422);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await post('/invoices/drafts/non-existent-id/draft');
        await expectError(res, 422);
    });
});
