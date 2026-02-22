import { setupApp, expectError } from './helpers';

const { post, createIssuedInvoice } = setupApp();

describe('POST /invoices/:id/cancel', () => {
    it('cancels an issued invoice', async () => {
        const invoice = await createIssuedInvoice();
        const res = await post(`/invoices/${invoice.id}/cancel`);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.status).toBe('CANCELLED');
    });

    it('returns 422 for non-existent invoice', async () => {
        const res = await post('/invoices/non-existent-id/cancel');
        await expectError(res, 422);
    });
});
