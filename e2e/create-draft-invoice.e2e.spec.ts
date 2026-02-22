import { Hono } from 'hono';
import { createApp } from '../http/create-app';

let app: Hono;

beforeEach(async () => {
    app = await createApp();
});

const post = (body: unknown) =>
    app.request('/invoices/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

describe('POST /invoices/drafts', () => {
    it('creates an empty draft invoice', async () => {
        const res = await post({});
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.data).toEqual(
            expect.objectContaining({ status: 'DRAFT' })
        );
        expect(json.data.id).toBeDefined();
    });

    it('creates a draft invoice with line items', async () => {
        const res = await post({
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '10',
        });
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.data.lineItems.items).toHaveLength(1);
        expect(json.data.lineItems.items[0].description).toBe('Service');
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await app.request('/invoices/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error.message).toBe('Invalid JSON');
        expect(json.error.issues).toEqual([]);
    });

    it('returns 400 for validation error', async () => {
        const res = await post({
            lineItems: [{ description: 'Item', price: { amount: '100' } }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error.message).toBe('Validation failed');
        expect(json.error.issues.length).toBeGreaterThan(0);
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
        const json = await res.json();
        expect(json.error.message).toBeDefined();
        expect(json.error.code).toBeDefined();
    });
});
