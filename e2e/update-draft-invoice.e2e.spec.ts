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

describe('PUT /invoices/drafts/:id', () => {
    it('updates a draft invoice', async () => {
        const draft = await createDraft();
        const res = await app.request(`/invoices/drafts/${draft.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lineItems: [
                    {
                        description: 'Consulting',
                        price: { amount: '100', currency: 'USD' },
                        quantity: '2',
                    },
                ],
                vatRate: '20',
            }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.lineItems.items).toHaveLength(1);
        expect(json.data.lineItems.items[0].description).toBe('Consulting');
    });

    it('updates with empty body', async () => {
        const draft = await createDraft();
        const res = await app.request(`/invoices/drafts/${draft.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(200);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await app.request('/invoices/drafts/non-existent-id', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(422);
    });

    it('returns 400 for invalid JSON', async () => {
        const draft = await createDraft();
        const res = await app.request(`/invoices/drafts/${draft.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        });
        expect(res.status).toBe(400);
    });
});
