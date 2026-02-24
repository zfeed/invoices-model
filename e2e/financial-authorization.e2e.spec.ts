import { setupApp, COMPLETE_DRAFT_REQUEST, expectError, resolveByPath, tooLong, expectValidationError, AUTHFLOW_POLICY_SHAPE, DOCUMENT_SHAPE } from './helpers';

const { postJson, postRaw, post, get, getData } = setupApp();

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

const createPolicyAndIssueInvoice = async () => {
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
    return { invoice, approverId };
};

describe('POST /authflow-policies', () => {
    it('creates an authflow policy', async () => {
        const res = await postJson('/authflow-policies', POLICY_REQUEST);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(AUTHFLOW_POLICY_SHAPE);
        expect(json.data.action).toBe('pay');
        expect(json.data.templates).toHaveLength(1);
        const template = json.data.templates[0];
        expect(template.id).toEqual(expect.any(String));
        expect(template.range).toEqual({
            from: { amount: '0', currency: 'USD' },
            to: { amount: '100000', currency: 'USD' },
        });
        expect(template.steps).toHaveLength(1);
        expect(template.steps[0].order).toBe(0);
        expect(template.steps[0].groups).toHaveLength(1);
        const group = template.steps[0].groups[0];
        expect(group.requiredApprovals).toBe(1);
        expect(group.approvers).toHaveLength(1);
        expect(group.approvers[0]).toEqual({
            id: expect.any(String),
            name: 'Alice',
            email: 'alice@example.com',
        });
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/authflow-policies', 'not json');
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

    it('returns 400 for missing action', async () => {
        const res = await postJson('/authflow-policies', { templates: [] });
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

    it('returns issue paths that resolve to the input object', async () => {
        const body = { templates: [] };
        const res = await postJson('/authflow-policies', body);
        const json = await res.json();
        for (const issue of json.error.issues) {
            const parent = resolveByPath(body, issue.path.slice(0, -1));
            expect(parent).toBeDefined();
            expect(resolveByPath(body, issue.path)).toBeUndefined();
        }
    });

    it('returns 400 when action exceeds max length', async () => {
        const res = await postJson('/authflow-policies', {
            action: tooLong(10),
            templates: [],
        });
        await expectValidationError(res, ['action']);
    });

    it('returns 400 when approver fields exceed max length', async () => {
        const res = await postJson('/authflow-policies', {
            action: 'pay',
            templates: [
                {
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '1000', currency: 'USD' },
                    },
                    steps: [
                        {
                            order: 0,
                            groups: [
                                {
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            name: tooLong(255),
                                            email: tooLong(320),
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        await expectValidationError(
            res,
            ['templates', 0, 'steps', 0, 'groups', 0, 'approvers', 0, 'name'],
            ['templates', 0, 'steps', 0, 'groups', 0, 'approvers', 0, 'email']
        );
    });

    it('returns 400 when money fields exceed max length', async () => {
        const res = await postJson('/authflow-policies', {
            action: 'pay',
            templates: [
                {
                    range: {
                        from: { amount: tooLong(20), currency: tooLong(3) },
                        to: { amount: '1000', currency: 'USD' },
                    },
                    steps: [],
                },
            ],
        });
        await expectValidationError(
            res,
            ['templates', 0, 'range', 'from', 'amount'],
            ['templates', 0, 'range', 'from', 'currency']
        );
    });

    it('returns 422 for overlapping ranges', async () => {
        const res = await postJson('/authflow-policies', {
            action: 'pay',
            templates: [
                {
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '5000', currency: 'USD' },
                    },
                    steps: [],
                },
                {
                    range: {
                        from: { amount: '3000', currency: 'USD' },
                        to: { amount: '10000', currency: 'USD' },
                    },
                    steps: [],
                },
            ],
        });
        await expectError(res, 422);
    });
});

describe('POST /documents/:referenceId/approve', () => {
    it('approves an action on a document', async () => {
        const { invoice, approverId } = await createPolicyAndIssueInvoice();
        const res = await postJson(`/documents/${invoice.id}/approve`, {
            action: 'pay',
            approver: { id: approverId, name: 'Alice', email: 'alice@example.com' },
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(DOCUMENT_SHAPE);
        expect(json.data.referenceId).toBe(invoice.id);
        expect(json.data.value).toEqual({ amount: expect.any(String), currency: 'USD' });
        const authflow = json.data.authflows.find(
            (a: any) => a.action === 'pay'
        );
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps[0].isApproved).toBe(true);
        expect(authflow.steps[0].groups[0].isApproved).toBe(true);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvals[0]).toEqual({
            approverId,
            createdAt: expect.any(String),
            comment: null,
        });
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/documents/some-ref/approve', 'not json');
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

    it('returns 400 when action exceeds max length', async () => {
        const res = await postJson('/documents/some-ref/approve', {
            action: tooLong(10),
            approver: { id: 'some-id', name: 'Alice', email: 'alice@example.com' },
        });
        await expectValidationError(res, ['action']);
    });

    it('returns 400 when approver fields exceed max length', async () => {
        const res = await postJson('/documents/some-ref/approve', {
            action: 'pay',
            approver: {
                id: tooLong(36),
                name: tooLong(255),
                email: tooLong(320),
            },
        });
        await expectValidationError(
            res,
            ['approver', 'id'],
            ['approver', 'name'],
            ['approver', 'email']
        );
    });

    it('returns 422 for non-existent document', async () => {
        const res = await postJson('/documents/non-existent/approve', {
            action: 'pay',
            approver: { id: 'some-id', name: 'Alice', email: 'alice@example.com' },
        });
        await expectError(res, 422);
    });

    it('returns 400 for missing action', async () => {
        const res = await postJson('/documents/some-ref/approve', {
            approver: { id: 'some-id', name: 'Alice', email: 'alice@example.com' },
        });
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

    it('returns issue paths that resolve to the input object', async () => {
        const body = {
            approver: { id: 'some-id', name: 'Alice', email: 'alice@example.com' },
        };
        const res = await postJson('/documents/some-ref/approve', body);
        const json = await res.json();
        for (const issue of json.error.issues) {
            const parent = resolveByPath(body, issue.path.slice(0, -1));
            expect(parent).toBeDefined();
            expect(resolveByPath(body, issue.path)).toBeUndefined();
        }
    });

    it('returns 422 when approving already approved action', async () => {
        const { invoice, approverId } = await createPolicyAndIssueInvoice();
        await postJson(`/documents/${invoice.id}/approve`, {
            action: 'pay',
            approver: { id: approverId, name: 'Alice', email: 'alice@example.com' },
        });
        const res = await postJson(`/documents/${invoice.id}/approve`, {
            action: 'pay',
            approver: { id: approverId, name: 'Alice', email: 'alice@example.com' },
        });
        await expectError(res, 422);
    });
});

describe('GET /documents/:referenceId/can-approve', () => {
    it('returns YES when approver can approve', async () => {
        const { invoice, approverId } = await createPolicyAndIssueInvoice();
        const res = await get(
            `/documents/${invoice.id}/can-approve?approverId=${approverId}&action=pay`
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual({ answer: 'YES' });
    });

    it('returns NO for unknown approver', async () => {
        const { invoice } = await createPolicyAndIssueInvoice();
        const res = await get(
            `/documents/${invoice.id}/can-approve?approverId=unknown-approver&action=pay`
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual({ answer: 'NO' });
    });

    it('returns UNKNOWN for non-existent document', async () => {
        const res = await get(
            '/documents/non-existent/can-approve?approverId=approver-1&action=pay'
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual({ answer: 'UNKNOWN' });
    });
});
