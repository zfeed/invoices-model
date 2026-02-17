import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Approver } from '../approver/approver';
import { Group } from '../groups/group';
import { Step } from '../step/step';
import {
    Authflow,
    approveAuthflow,
    createAuthflow,
    findAuthflowByAction,
} from './authflow';

describe('createAuthflow', () => {
    it('should create an authflow successfully with all steps approved', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: true,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                        ],
                        approvals: [
                            {
                                approverId: '1',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [
                    {
                        id: 'group-2',
                        isApproved: true,
                        approvers: [
                            { id: '2', name: 'Bob', email: 'bob@example.com' },
                        ],
                        approvals: [
                            {
                                approverId: '2',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.id).toBeDefined();
    });

    it('should create an authflow with isApproved false when some steps are not approved', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: true,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                        ],
                        approvals: [
                            {
                                approverId: '1',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: false,
                groups: [
                    {
                        id: 'group-2',
                        isApproved: false,
                        approvers: [
                            { id: '2', name: 'Bob', email: 'bob@example.com' },
                        ],
                        approvals: [],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(2);
    });

    it('should create an authflow with isApproved false when all steps are not approved', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: false,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: false,
                        approvers: [
                            {
                                id: '1',
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
                isApproved: false,
                groups: [
                    {
                        id: 'group-2',
                        isApproved: false,
                        approvers: [
                            { id: '2', name: 'Bob', email: 'bob@example.com' },
                        ],
                        approvals: [],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-payment',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-payment');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(2);
    });

    it('should create an authflow with empty steps array', () => {
        const steps: Step[] = [];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(true); // all([]) returns true
        expect(authflow.steps).toHaveLength(0);
    });

    it('should fail to create an authflow with duplicate step orders', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 1,
                isApproved: true,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: true,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                        ],
                        approvals: [
                            {
                                approverId: '1',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [
                    {
                        id: 'group-2',
                        isApproved: true,
                        approvers: [
                            { id: '2', name: 'Bob', email: 'bob@example.com' },
                        ],
                        approvals: [
                            {
                                approverId: '2',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate step orders found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE
        );
    });

    it('should fail when all steps have the same order', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-2',
                order: 0,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-3',
                order: 0,
                isApproved: true,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-contract',
            steps,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate step orders found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE
        );
    });

    it('should fail when two out of three steps have duplicate orders', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-3',
                order: 0,
                isApproved: true,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-expense',
            steps,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate step orders found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE
        );
    });

    it('should create an authflow successfully with unique step orders', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-3',
                order: 2,
                isApproved: true,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-budget',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-budget');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should create an authflow with non-sequential but unique orders', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 5,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-2',
                order: 10,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-3',
                order: 15,
                isApproved: true,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-transfer',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-transfer');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should create an authflow with single step', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: true,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                        ],
                        approvals: [
                            {
                                approverId: '1',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(1);
        expect(authflow.id).toBeDefined();
    });

    it('should create an authflow with single non-approved step', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: false,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: false,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                        ],
                        approvals: [],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-payment',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-payment');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(1);
    });

    it('should create an authflow with multiple steps where only the last is not approved', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-3',
                order: 2,
                isApproved: false,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should create an authflow with multiple steps where only the first is not approved', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: false,
                groups: [],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-3',
                order: 2,
                isApproved: true,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-purchase',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-purchase');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should generate a unique ID for each authflow', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [],
            },
        ];

        const result1 = createAuthflow({
            action: 'approve-invoice-1',
            steps,
        });

        const result2 = createAuthflow({
            action: 'approve-invoice-2',
            steps,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const authflow1 = result1.unwrap();
        const authflow2 = result2.unwrap();

        expect(authflow1.id).toBeDefined();
        expect(authflow2.id).toBeDefined();
        expect(authflow1.id).not.toBe(authflow2.id);
    });

    it('should create an authflow with different action names', () => {
        const steps: Step[] = [];

        const result1 = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        const result2 = createAuthflow({
            action: 'approve-payment',
            steps,
        });

        const result3 = createAuthflow({
            action: 'approve-contract',
            steps,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result3.isOk()).toBe(true);

        expect(result1.unwrap().action).toBe('approve-invoice');
        expect(result2.unwrap().action).toBe('approve-payment');
        expect(result3.unwrap().action).toBe('approve-contract');
    });

    it('should create an authflow with complex multi-level approval structure', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 0,
                isApproved: true,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: true,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                            { id: '2', name: 'Bob', email: 'bob@example.com' },
                        ],
                        approvals: [
                            {
                                approverId: '1',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                            {
                                approverId: '2',
                                createdAt: new Date(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'step-2',
                order: 1,
                isApproved: true,
                groups: [
                    {
                        id: 'group-2',
                        isApproved: true,
                        approvers: [
                            {
                                id: '3',
                                name: 'Charlie',
                                email: 'charlie@example.com',
                            },
                        ],
                        approvals: [
                            {
                                approverId: '3',
                                createdAt: new Date(),
                                comment: null,
                            },
                        ],
                    },
                ],
            },
        ];

        const result = createAuthflow({
            action: 'approve-major-purchase',
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-major-purchase');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.steps[0].groups).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvers).toHaveLength(2);
    });

    it('should fail when steps have large duplicate order numbers', () => {
        const steps: Step[] = [
            {
                id: 'step-1',
                order: 9999,
                isApproved: true,
                groups: [],
            },
            {
                id: 'step-2',
                order: 9999,
                isApproved: true,
                groups: [],
            },
        ];

        const result = createAuthflow({
            action: 'approve-invoice',
            steps,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate step orders found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE
        );
    });
});

describe('findAuthflowByAction', () => {
    const makeAuthflow = (id: string, action: string): Authflow => ({
        id,
        action,
        isApproved: false,
        steps: [],
    });

    it('should find an authflow by action', () => {
        const authflows = [
            makeAuthflow('1', 'submit'),
            makeAuthflow('2', 'review'),
        ];

        const result = findAuthflowByAction(authflows, 'review');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().id).toBe('2');
    });

    it('should return the first matching authflow', () => {
        const authflows = [
            makeAuthflow('1', 'submit'),
            makeAuthflow('2', 'review'),
            makeAuthflow('3', 'approve'),
        ];

        const result = findAuthflowByAction(authflows, 'submit');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().id).toBe('1');
    });

    it('should return an error when action is not found', () => {
        const authflows = [
            makeAuthflow('1', 'submit'),
            makeAuthflow('2', 'review'),
        ];

        const result = findAuthflowByAction(authflows, 'non-existent');

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Authflow with action non-existent not found'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND
        );
    });

    it('should return an error when authflows array is empty', () => {
        const result = findAuthflowByAction([], 'submit');

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Authflow with action submit not found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND
        );
    });

    it('should treat action names as case-sensitive', () => {
        const authflows = [makeAuthflow('1', 'Submit')];

        const result = findAuthflowByAction(authflows, 'submit');

        expect(result.isError()).toBe(true);
    });
});

describe('approveAuthflow', () => {
    const approver1: Approver = {
        id: 'approver-1',
        name: 'Alice',
        email: 'alice@example.com',
    };

    const approver2: Approver = {
        id: 'approver-2',
        name: 'Bob',
        email: 'bob@example.com',
    };

    const makeGroup = (
        id: string,
        approvers: Approver[],
        isApproved: boolean
    ): Group => ({
        id,
        isApproved,
        approvers,
        approvals: isApproved
            ? approvers.map((a) => ({
                  approverId: a.id,
                  createdAt: new Date(),
                  comment: null,
              }))
            : [],
    });

    const makeStep = (
        id: string,
        order: number,
        groups: Group[],
        isApproved: boolean
    ): Step => ({
        id,
        order,
        isApproved,
        groups,
    });

    it('should approve the first unapproved step', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'group-1',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.isApproved).toBe(true);
        expect(updated.steps[0].isApproved).toBe(true);
    });

    it('should approve only the current step and leave later steps unapproved', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step1, step2],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'group-1',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.steps[0].isApproved).toBe(true);
        expect(updated.steps[1].isApproved).toBe(false);
        expect(updated.isApproved).toBe(false);
    });

    it('should fully approve authflow when last step is approved', () => {
        const group1 = makeGroup('group-1', [approver1], true);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], true);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step1, step2],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'group-2',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.isApproved).toBe(true);
    });

    it('should fail when all steps are already approved', () => {
        const group = makeGroup('group-1', [approver1], true);
        const step = makeStep('step-1', 0, [group], true);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: true,
            steps: [step],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'group-1',
            approver: approver1,
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
        );
    });

    it('should fail when group is not found in the current step', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'non-existent',
            approver: approver1,
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should fail when approver is not in the group', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'group-1',
            approver: approver2,
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND
        );
    });

    it('should support sequential approvals across steps', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step1, step2],
        };

        // First approval
        const result1 = approveAuthflow({
            authflow,
            groupId: 'group-1',
            approver: approver1,
        });

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.isApproved).toBe(false);

        // Second approval
        const result2 = approveAuthflow({
            authflow: afterFirst,
            groupId: 'group-2',
            approver: approver1,
        });

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.isApproved).toBe(true);
    });

    it('should preserve the action name after approval', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow: Authflow = {
            id: 'authflow-1',
            action: 'submit',
            isApproved: false,
            steps: [step],
        };

        const result = approveAuthflow({
            authflow,
            groupId: 'group-1',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().action).toBe('submit');
    });
});
