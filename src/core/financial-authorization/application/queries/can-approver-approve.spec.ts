import { FinancialDocument } from '../../domain/document/document';
import { UnitOfWorkFactory } from '../../../../infrastructure/unit-of-work/unit-of-work-factory';
import { CanApproverApprove } from './can-approver-approve';

describe('CanApproverApprove', () => {
    it('should return UNKNOWN when document does not exist', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const question = new CanApproverApprove(unitOfWorkFactory);

        const answer = await question
            .can('approver-1')
            .perform('pay')
            .on('non-existent-ref')
            .ask();

        expect(answer).toBe('UNKNOWN');
    });

    it('should return YES when approver can approve the action', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'ref-1',
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: 'authflow-1',
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: 'step-1',
                            order: 0,
                            groups: [
                                {
                                    id: 'group-1',
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: 'approver-1',
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        await unitOfWorkFactory.start(async (uow) => {
            await uow.collection(FinancialDocument).add(document);
        });

        const question = new CanApproverApprove(unitOfWorkFactory);

        const answer = await question
            .can('approver-1')
            .perform('pay')
            .on('ref-1')
            .ask();

        expect(answer).toBe('YES');
    });

    it('should return NO when approver is not in any group', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'ref-1',
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: 'authflow-1',
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: 'step-1',
                            order: 0,
                            groups: [
                                {
                                    id: 'group-1',
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: 'approver-1',
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        await unitOfWorkFactory.start(async (uow) => {
            await uow.collection(FinancialDocument).add(document);
        });

        const question = new CanApproverApprove(unitOfWorkFactory);

        const answer = await question
            .can('approver-2')
            .perform('pay')
            .on('ref-1')
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when authflow is already approved', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'ref-1',
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: 'authflow-1',
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: 'step-1',
                            order: 0,
                            groups: [
                                {
                                    id: 'group-1',
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: 'approver-1',
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [
                                        {
                                            approverId: 'approver-1',
                                            createdAt: new Date().toISOString(),
                                            comment: null,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        await unitOfWorkFactory.start(async (uow) => {
            await uow.collection(FinancialDocument).add(document);
        });

        const question = new CanApproverApprove(unitOfWorkFactory);

        const answer = await question
            .can('approver-1')
            .perform('pay')
            .on('ref-1')
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when action does not exist on the document', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'ref-1',
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: 'authflow-1',
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: 'step-1',
                            order: 0,
                            groups: [
                                {
                                    id: 'group-1',
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: 'approver-1',
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        await unitOfWorkFactory.start(async (uow) => {
            await uow.collection(FinancialDocument).add(document);
        });

        const question = new CanApproverApprove(unitOfWorkFactory);

        const answer = await question
            .can('approver-1')
            .perform('non-existent')
            .on('ref-1')
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when approver is in a later step', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'ref-1',
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: 'authflow-1',
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: 'step-1',
                            order: 0,
                            groups: [
                                {
                                    id: 'group-1',
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: 'approver-1',
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                        {
                            id: 'step-2',
                            order: 1,
                            groups: [
                                {
                                    id: 'group-2',
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: 'approver-2',
                                            name: 'Bob',
                                            email: 'bob@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        await unitOfWorkFactory.start(async (uow) => {
            await uow.collection(FinancialDocument).add(document);
        });

        const question = new CanApproverApprove(unitOfWorkFactory);

        const answer = await question
            .can('approver-2')
            .perform('pay')
            .on('ref-1')
            .ask();

        expect(answer).toBe('NO');
    });
});
