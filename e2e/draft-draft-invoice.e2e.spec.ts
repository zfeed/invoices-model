import { Hono } from 'hono';
import { createApp } from '../src/http/create-app';

let app: Hono;

beforeEach(async () => {
    app = await createApp();
});

const createDraft = async () => {
    const res = await app.request('/invoices/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    const json = await res.json();
    return json.data;
};

describe('POST /invoices/drafts/:id/draft', () => {
    it('moves an archived draft back to draft', async () => {
        const draft = await createDraft();
        await app.request(`/invoices/drafts/${draft.id}/archive`, {
            method: 'POST',
        });
        const res = await app.request(
            `/invoices/drafts/${draft.id}/draft`,
            { method: 'POST' }
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.status).toBe('DRAFT');
    });

    it('returns 422 for non-archived draft', async () => {
        const draft = await createDraft();
        const res = await app.request(
            `/invoices/drafts/${draft.id}/draft`,
            { method: 'POST' }
        );
        expect(res.status).toBe(422);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await app.request(
            '/invoices/drafts/non-existent-id/draft',
            { method: 'POST' }
        );
        expect(res.status).toBe(422);
    });
});
