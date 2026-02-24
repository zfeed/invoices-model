import { setupApp, expectError, EMPTY_DRAFT_SHAPE } from './helpers';

const { post, createDraft } = setupApp();

describe('POST /invoices/drafts/:id/archive', () => {
    it('archives a draft invoice', async () => {
        const draft = await createDraft();
        const res = await post(`/invoices/drafts/${draft.id}/archive`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual({ ...EMPTY_DRAFT_SHAPE, id: draft.id });
        expect(json.data.status).toBe('ARCHIVED');
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await post('/invoices/drafts/non-existent-id/archive');
        await expectError(res, 422);
    });
});
