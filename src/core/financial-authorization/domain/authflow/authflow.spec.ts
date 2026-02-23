import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Approver } from '../approver/approver';
import { Step } from '../step/step';
import { Action } from '../action/action';
import { Money } from '../money/money';
import { Range } from '../range/range';
import { Authflow } from './authflow';

const testRange = Range.create(
    Money.create('0', 'USD').unwrap(),
    Money.create('100000', 'USD').unwrap()
).unwrap();

describe('createAuthflow', () => {
    it('should create an authflow successfully with all steps approved', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.id).toBeDefined();
    });

    it('should create an authflow with isApproved false when some steps are not approved', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
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
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(2);
    });

    it('should create an authflow with isApproved false when all steps are not approved', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
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
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
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
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-payment').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-payment');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(2);
    });

    it('should create an authflow with empty steps array', () => {
        const steps: Step[] = [];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(true); // all([]) returns true
        expect(authflow.steps).toHaveLength(0);
    });

    it('should fail to create an authflow with duplicate step orders', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 1,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
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
            Step.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 0,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-3',
                order: 0,
                groups: [],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-contract').unwrap(),
            range: testRange,
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
            Step.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-3',
                order: 0,
                groups: [],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-expense').unwrap(),
            range: testRange,
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
            Step.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-3',
                order: 2,
                groups: [],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-budget').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-budget');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should create an authflow with non-sequential but unique orders', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 5,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 10,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-3',
                order: 15,
                groups: [],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-transfer').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-transfer');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should create an authflow with single step', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(1);
        expect(authflow.id).toBeDefined();
    });

    it('should create an authflow with single non-approved step', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
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
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-payment').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-payment');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(1);
    });

    it('should create an authflow with multiple steps where only the last is not approved', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-3',
                order: 2,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: false,
                        approvers: [
                            { id: '1', name: 'Alice', email: 'alice@example.com' },
                        ],
                        approvals: [],
                    },
                ],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should create an authflow with multiple steps where only the first is not approved', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [
                    {
                        id: 'group-1',
                        isApproved: false,
                        approvers: [
                            { id: '1', name: 'Alice', email: 'alice@example.com' },
                        ],
                        approvals: [],
                    },
                ],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-3',
                order: 2,
                groups: [],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-purchase').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-purchase');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(3);
    });

    it('should generate a unique ID for each authflow', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [],
            }),
        ];

        const result1 = Authflow.create({
            action: Action.create('approve-invoice-1').unwrap(),
            range: testRange,
            steps,
        });

        const result2 = Authflow.create({
            action: Action.create('approve-invoice-2').unwrap(),
            range: testRange,
            steps,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const authflow1 = result1.unwrap();
        const authflow2 = result2.unwrap();

        expect(authflow1.id).toBeDefined();
        expect(authflow2.id).toBeDefined();
        expect(authflow1.id.toPlain()).not.toBe(authflow2.id.toPlain());
    });

    it('should create an authflow with different action names', () => {
        const steps: Step[] = [];

        const result1 = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
            steps,
        });

        const result2 = Authflow.create({
            action: Action.create('approve-payment').unwrap(),
            range: testRange,
            steps,
        });

        const result3 = Authflow.create({
            action: Action.create('approve-contract').unwrap(),
            range: testRange,
            steps,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result3.isOk()).toBe(true);

        expect(result1.unwrap().action.toPlain()).toBe('approve-invoice');
        expect(result2.unwrap().action.toPlain()).toBe('approve-payment');
        expect(result3.unwrap().action.toPlain()).toBe('approve-contract');
    });

    it('should create an authflow with complex multi-level approval structure', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 0,
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
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                            {
                                approverId: '2',
                                createdAt: new Date().toISOString(),
                                comment: 'Approved',
                            },
                        ],
                    },
                ],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 1,
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
                                createdAt: new Date().toISOString(),
                                comment: null,
                            },
                        ],
                    },
                ],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-major-purchase').unwrap(),
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-major-purchase');
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.steps[0].groups).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvers).toHaveLength(2);
    });

    it('should fail when steps have large duplicate order numbers', () => {
        const steps: Step[] = [
            Step.fromPlain({
                id: 'step-1',
                order: 9999,
                groups: [],
            }),
            Step.fromPlain({
                id: 'step-2',
                order: 9999,
                groups: [],
            }),
        ];

        const result = Authflow.create({
            action: Action.create('approve-invoice').unwrap(),
            range: testRange,
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
    const makeAuthflow = (id: string, action: string): Authflow =>
        Authflow.fromPlain({
            id,
            action,
            range: testRange.toPlain(),
            steps: [],
        });

    it('should find an authflow by action', () => {
        const authflows = [
            makeAuthflow('1', 'submit'),
            makeAuthflow('2', 'review'),
        ];

        const found = authflows.find((a) =>
            a.action.equals(Action.fromPlain('review'))
        );

        expect(found).toBeDefined();
        expect(found!.id.toPlain()).toBe('2');
    });

    it('should return the first matching authflow', () => {
        const authflows = [
            makeAuthflow('1', 'submit'),
            makeAuthflow('2', 'review'),
            makeAuthflow('3', 'approve'),
        ];

        const found = authflows.find((a) =>
            a.action.equals(Action.fromPlain('submit'))
        );

        expect(found).toBeDefined();
        expect(found!.id.toPlain()).toBe('1');
    });

    it('should return undefined when action is not found', () => {
        const authflows = [
            makeAuthflow('1', 'submit'),
            makeAuthflow('2', 'review'),
        ];

        const found = authflows.find((a) =>
            a.action.equals(Action.fromPlain('non-existent'))
        );

        expect(found).toBeUndefined();
    });

    it('should return undefined when authflows array is empty', () => {
        const found: Authflow | undefined = ([] as Authflow[]).find((a) =>
            a.action.equals(Action.fromPlain('submit'))
        );

        expect(found).toBeUndefined();
    });

    it('should treat action names as case-sensitive', () => {
        const authflows = [makeAuthflow('1', 'Submit')];

        const found = authflows.find((a) =>
            a.action.equals(Action.fromPlain('submit'))
        );

        expect(found).toBeUndefined();
    });
});

describe('approveAuthflow', () => {
    const approver1 = Approver.fromPlain({
        id: 'approver-1',
        name: 'Alice',
        email: 'alice@example.com',
    });

    const approver2 = Approver.fromPlain({
        id: 'approver-2',
        name: 'Bob',
        email: 'bob@example.com',
    });

    const makeAuthflow = (
        id: string,
        action: string,
        stepsPlain: {
            id: string;
            order: number;
            groups: {
                id: string;
                isApproved: boolean;
                approvers: { id: string; name: string; email: string }[];
                approvals: { approverId: string; createdAt: string; comment: string | null }[];
            }[];
        }[]
    ): Authflow =>
        Authflow.fromPlain({
            id,
            action,
            range: testRange.toPlain(),
            steps: stepsPlain,
        });

    const makeGroupPlain = (
        id: string,
        approvers: { id: string; name: string; email: string }[],
        isApproved: boolean
    ) => ({
        id,
        isApproved,
        approvers,
        approvals: isApproved
            ? approvers.map((a) => ({
                  approverId: a.id,
                  createdAt: new Date().toISOString(),
                  comment: null,
              }))
            : [],
    });

    const makeStepPlain = (
        id: string,
        order: number,
        groups: ReturnType<typeof makeGroupPlain>[]
    ) => ({
        id,
        order,
        groups,
    });

    it('should approve the first unapproved step', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step]);

        const result = authflow.approve(approver1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.isApproved).toBe(true);
        expect(updated.steps[0].isApproved).toBe(true);
    });

    it('should approve only the current step and leave later steps unapproved', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step1, step2]);

        const result = authflow.approve(approver1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.steps[0].isApproved).toBe(true);
        expect(updated.steps[1].isApproved).toBe(false);
        expect(updated.isApproved).toBe(false);
    });

    it('should fully approve authflow when last step is approved', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], true);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step1, step2]);

        const result = authflow.approve(approver1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.isApproved).toBe(true);
    });

    it('should fail when all steps are already approved', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], true);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step]);

        const result = authflow.approve(approver1);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
        );
    });

    it('should fail when approver is not in any group', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step]);

        const result = authflow.approve(approver2);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should support sequential approvals across steps', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step1, step2]);

        // First approval
        const result1 = authflow.approve(approver1);

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.isApproved).toBe(false);

        // Second approval
        const result2 = afterFirst.approve(approver1);

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.isApproved).toBe(true);
    });

    it('should preserve authflow id after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step]);

        const result = authflow.approve(approver1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.id.toPlain()).toBe('authflow-1');
    });

    it('should preserve step and group ids after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step]);

        const result = authflow.approve(approver1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.steps[0].id.toPlain()).toBe('step-1');
        expect(updated.steps[0].groups[0].id.toPlain()).toBe('group-1');
    });

    it('should preserve all ids across sequential approvals', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step1, step2]);

        const result1 = authflow.approve(approver1);

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.id.toPlain()).toBe('authflow-1');
        expect(afterFirst.steps[0].id.toPlain()).toBe('step-1');
        expect(afterFirst.steps[1].id.toPlain()).toBe('step-2');

        const result2 = afterFirst.approve(approver1);

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.id.toPlain()).toBe('authflow-1');
        expect(afterSecond.steps[0].id.toPlain()).toBe('step-1');
        expect(afterSecond.steps[1].id.toPlain()).toBe('step-2');
    });

    it('should preserve the action name after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflow('authflow-1', 'submit', [step]);

        const result = authflow.approve(approver1);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().action.toPlain()).toBe('submit');
    });
});
