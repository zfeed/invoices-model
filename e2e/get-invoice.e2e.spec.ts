import { setupApp, expectError } from './helpers';

const { get, getData, createIssuedInvoice } = setupApp();

describe('GET /invoices/:id', () => {
    it('returns the invoice as a flat dto', async () => {
        const invoice = await createIssuedInvoice();

        const res = await get(`/invoices/${invoice.id}`);
        expect(res.status).toBe(200);

        const data = await getData(res);
        expect(data).toEqual({
            id: invoice.id,
            status: 'ISSUED',
            subtotalAmount: expect.any(String),
            subtotalCurrency: expect.any(String),
            totalAmount: expect.any(String),
            totalCurrency: expect.any(String),
            vatRate: expect.any(String),
            vatAmount: expect.any(String),
            vatCurrency: expect.any(String),
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
                paypalEmail: 'jane@paypal.com',
            },
            lineItems: [
                {
                    id: expect.any(String),
                    description: 'Service',
                    priceAmount: expect.any(String),
                    priceCurrency: 'USD',
                    quantity: expect.any(String),
                    totalAmount: expect.any(String),
                    totalCurrency: 'USD',
                },
            ],
        });
    });

    it('returns 422 for non-existent invoice', async () => {
        const res = await get(
            '/invoices/00000000-0000-0000-0000-000000000000'
        );
        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.error.code).toBe('A1000');
        expect(json.error.message).toBe('Invoice not found');
    });
});
