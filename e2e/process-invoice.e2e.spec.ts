import { setupApp, expectError, INVOICE_SHAPE } from './helpers';

const { post, createIssuedInvoice } = setupApp();

describe('POST /invoices/:id/process', () => {
    it('processes an issued invoice', async () => {
        const invoice = await createIssuedInvoice();
        const res = await post(`/invoices/${invoice.id}/process`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(INVOICE_SHAPE);
        expect(json.data.status).toBe('PROCESSING');
        expect(json.data.id).toBe(invoice.id);
    });

    it('returns 422 for non-existent invoice', async () => {
        const res = await post('/invoices/non-existent-id/process');
        await expectError(res, 422);
    });
});
