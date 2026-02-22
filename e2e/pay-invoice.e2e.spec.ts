import { setupApp, expectError } from './helpers';

const { postJson, postRaw, createProcessingInvoice } = setupApp();

describe('POST /invoices/:id/pay', () => {
    it('returns 400 for missing approverId', async () => {
        const invoice = await createProcessingInvoice();
        const res = await postJson(`/invoices/${invoice.id}/pay`, {});
        await expectError(res, 400, 'Validation failed');
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/some-id/pay', 'not json');
        await expectError(res, 400, 'Invalid JSON');
    });

    it('returns 422 for non-existent invoice', async () => {
        const res = await postJson('/invoices/non-existent-id/pay', {
            approverId: 'approver-1',
        });
        await expectError(res, 422);
    });

    it('returns 422 when payment is not authorized', async () => {
        const invoice = await createProcessingInvoice();
        const res = await postJson(`/invoices/${invoice.id}/pay`, {
            approverId: 'approver-1',
        });
        await expectError(res, 422);
    });
});
