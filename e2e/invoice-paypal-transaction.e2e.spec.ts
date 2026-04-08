import { vi } from 'vitest';
import { setupApp, INVOICE_SHAPE, POPULATED_DRAFT_SHAPE } from './helpers';

const { postJson, post, get, getData } = setupApp();

const DRAFT_REQUEST = {
    lineItems: [
        {
            description: 'Consulting services',
            price: { amount: '500', currency: 'USD' },
            quantity: '2',
        },
    ],
    vatRate: '20',
    issueDate: '2025-01-01',
    dueDate: '2025-02-01',
    issuer: {
        type: 'COMPANY',
        name: 'Acme Inc.',
        address: '1 Infinite Loop',
        taxId: 'ACME-001',
        email: 'billing@acme.com',
    },
    recipient: {
        type: 'INDIVIDUAL',
        name: 'John Doe',
        address: '742 Evergreen Terrace',
        taxId: 'JD-001',
        email: 'john@example.com',
        taxResidenceCountry: 'US',
        billing: {
            type: 'PAYPAL',
            email: 'sb-pp0qz50067458@business.example.com',
        },
    },
};

describe('Invoice PayPal transaction flow', () => {
    it('drafts an empty invoice, fills it, completes it, and processes it', async () => {
        const empty = await getData(await postJson('/invoices/drafts', {}));
        expect(empty.id).toEqual(expect.any(String));
        expect(empty.status).toBe('DRAFT');

        const filled = await getData(
            await postJson(`/invoices/drafts/${empty.id}/update`, DRAFT_REQUEST)
        );
        expect(filled).toEqual(POPULATED_DRAFT_SHAPE);
        expect(filled.id).toBe(empty.id);

        const completed = await getData(
            await post(`/invoices/drafts/${empty.id}/complete`)
        );
        expect(completed).toEqual(INVOICE_SHAPE);
        expect(completed.status).toBe('ISSUED');

        const processed = await getData(
            await post(`/invoices/${completed.id}/process`)
        );
        expect(processed).toEqual(INVOICE_SHAPE);
        expect(processed.id).toBe(completed.id);
        expect(processed.status).toBe('PROCESSING');

        const terminal = await vi.waitUntil(
            async () => {
                const res = await get(`/invoices/${completed.id}`);
                if (res.status !== 200) return false;
                const { data } = await res.json();
                return data.status === 'PAID' || data.status === 'FAILED'
                    ? data
                    : false;
            },
            { timeout: 120_000, interval: 1_000 }
        );

        expect(['PAID', 'FAILED']).toContain(terminal.status);
    });
});
