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

describe('POST /invoices/drafts/:id/archive', () => {
    it('archives a draft invoice', async () => {
        const draft = await createDraft();
        const res = await app.request(
            `/invoices/drafts/${draft.id}/archive`,
            { method: 'POST' }
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.status).toBe('ARCHIVED');
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await app.request(
            '/invoices/drafts/non-existent-id/archive',
            { method: 'POST' }
        );
        expect(res.status).toBe(422);
    });
});
