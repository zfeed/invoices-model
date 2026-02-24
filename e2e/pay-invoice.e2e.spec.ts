import { setupApp, expectError } from './helpers';

const { postJson, postRaw, createProcessingInvoice } = setupApp();

describe('POST /invoices/:id/pay', () => {
    it('returns 400 for missing approverId', async () => {
        const invoice = await createProcessingInvoice();
        const res = await postJson(`/invoices/${invoice.id}/pay`, {});
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
        expect(json.error.issues.length).toBeGreaterThan(0);
        for (const issue of json.error.issues) {
            expect(issue).toEqual({
                path: expect.any(Array),
                message: expect.any(String),
            });
            for (const segment of issue.path) {
                expect(['string', 'number']).toContain(typeof segment);
            }
        }
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/some-id/pay', 'not json');
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
        for (const issue of json.error.issues) {
            expect(issue).toEqual({
                path: expect.any(Array),
                message: expect.any(String),
            });
            for (const segment of issue.path) {
                expect(['string', 'number']).toContain(typeof segment);
            }
        }
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
