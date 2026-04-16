import { setupApp, expectError, INVOICE_SHAPE } from './helpers.ts';

const { post, createIssuedInvoice } = setupApp();

describe('POST /invoices/:id/cancel', () => {
    it('cancels an issued invoice', async () => {
        const invoice = await createIssuedInvoice();
        const res = await post(`/invoices/${invoice.id}/cancel`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(INVOICE_SHAPE);
        expect(json.data.status).toBe('CANCELLED');
        expect(json.data.id).toBe(invoice.id);
    });

    it('returns 422 for non-existent invoice', async () => {
        const res = await post('/invoices/non-existent-id/cancel');
        await expectError(res, 422);
    });
});
