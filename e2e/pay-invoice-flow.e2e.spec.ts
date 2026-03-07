import { setupApp, COMPLETE_DRAFT_REQUEST, INVOICE_SHAPE } from './helpers';

const { postJson, post, get, getData } = setupApp();

const POLICY_REQUEST = {
    action: 'pay',
    templates: [
        {
            range: {
                from: { amount: '0', currency: 'USD' },
                to: { amount: '100000', currency: 'USD' },
            },
            steps: [
                {
                    order: 0,
                    groups: [
                        {
                            requiredApprovals: 1,
                            approvers: [
                                { name: 'Alice', email: 'alice@example.com' },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

describe('Pay invoice flow', () => {
    it('creates policy, issues invoice, and pays with authorized approver', async () => {
        const policy = await getData(
            await postJson('/authflow-policies', POLICY_REQUEST)
        );
        const approverId =
            policy.templates[0].steps[0].groups[0].approvers[0].id;

        const draft = await getData(
            await postJson('/invoices/drafts', COMPLETE_DRAFT_REQUEST)
        );

        const invoice = await getData(
            await post(`/invoices/drafts/${draft.id}/complete`)
        );
        expect(invoice.status).toBe('ISSUED');

        const processed = await getData(
            await post(`/invoices/${invoice.id}/process`)
        );
        expect(processed.status).toBe('PROCESSING');

        const canApproveRes = await get(
            `/documents/${invoice.id}/can-approve?approverId=${approverId}&action=pay`
        );
        expect((await canApproveRes.json()).data).toEqual({ answer: 'YES' });

        const payRes = await postJson(`/invoices/${invoice.id}/pay`, {
            approverId,
        });
        expect(payRes.status).toBe(200);
        const paid = await getData(payRes);
        expect(paid).toEqual(INVOICE_SHAPE);
        expect(paid.status).toBe('PAID');
    });
});
