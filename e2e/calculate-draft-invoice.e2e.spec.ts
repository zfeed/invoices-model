import { Hono } from 'hono';
import { createApp } from '../src/http/create-app';

let app: Hono;

beforeEach(async () => {
    app = await createApp();
});

const post = (body: unknown) =>
    app.request('/invoices/drafts/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

describe('POST /invoices/drafts/calculate', () => {
    it('calculates totals for a draft invoice', async () => {
        const res = await post({
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '3',
                },
            ],
            vatRate: '10',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toBeDefined();
        expect(json.data.lineItems.subtotal).toBeDefined();
        expect(json.data.total).toBeDefined();
    });

    it('calculates with empty body', async () => {
        const res = await post({});
        expect(res.status).toBe(200);
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await app.request('/invoices/drafts/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        });
        expect(res.status).toBe(400);
    });

    it('returns 422 for domain error', async () => {
        const res = await post({
            lineItems: [
                {
                    description: 'Item',
                    price: { amount: '100', currency: 'INVALID' },
                    quantity: '1',
                },
            ],
        });
        expect(res.status).toBe(422);
    });
});
