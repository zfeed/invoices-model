import { Hono } from 'hono';
import { createApp } from '../http/create-app';

let app: Hono;

const COMPLETE_DRAFT_REQUEST = {
    lineItems: [
        {
            description: 'Service',
            price: { amount: '200', currency: 'USD' },
            quantity: '1',
        },
    ],
    vatRate: '10',
    issueDate: '2025-01-01',
    dueDate: '2025-02-01',
    issuer: {
        type: 'COMPANY',
        name: 'Company Inc.',
        address: '123 Main St',
        taxId: 'TAX123',
        email: 'info@company.com',
    },
    recipient: {
        type: 'INDIVIDUAL',
        name: 'Jane Smith',
        address: '456 Oak Ave',
        taxId: 'TAX456',
        email: 'jane@example.com',
        taxResidenceCountry: 'US',
        billing: {
            type: 'PAYPAL',
            email: 'jane@paypal.com',
        },
    },
};

beforeEach(async () => {
    app = await createApp();
});

const createDraft = async (body: unknown = COMPLETE_DRAFT_REQUEST) => {
    const res = await app.request('/invoices/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    return json.data;
};

describe('POST /invoices/drafts/:id/complete', () => {
    it('completes a fully populated draft', async () => {
        const draft = await createDraft();
        const res = await app.request(
            `/invoices/drafts/${draft.id}/complete`,
            { method: 'POST' }
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.status).toBe('ISSUED');
    });

    it('returns 422 for incomplete draft', async () => {
        const draft = await createDraft({});
        const res = await app.request(
            `/invoices/drafts/${draft.id}/complete`,
            { method: 'POST' }
        );
        expect(res.status).toBe(422);
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await app.request(
            '/invoices/drafts/non-existent-id/complete',
            { method: 'POST' }
        );
        expect(res.status).toBe(422);
    });
});
