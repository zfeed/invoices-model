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

const createIssuedInvoice = async () => {
    const createRes = await app.request('/invoices/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(COMPLETE_DRAFT_REQUEST),
    });
    const draft = (await createRes.json()).data;
    const completeRes = await app.request(
        `/invoices/drafts/${draft.id}/complete`,
        { method: 'POST' }
    );
    return (await completeRes.json()).data;
};

describe('POST /invoices/:id/process', () => {
    it('processes an issued invoice', async () => {
        const invoice = await createIssuedInvoice();
        const res = await app.request(`/invoices/${invoice.id}/process`, {
            method: 'POST',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.status).toBe('PROCESSING');
    });

    it('returns 422 for non-existent invoice', async () => {
        const res = await app.request('/invoices/non-existent-id/process', {
            method: 'POST',
        });
        expect(res.status).toBe(422);
    });
});
