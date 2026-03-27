import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { Email } from '../email/email';
import { Group } from '../groups/group';
import { Step } from '../step/step';
import { Action } from '../action/action';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { Name } from '../name/name';
import { Order } from '../order/order';
import { Range } from '../range/range';
import { Authflow } from './authflow';

const testRange = Range.create(
    Money.create('0', 'USD').unwrap(),
    Money.create('100000', 'USD').unwrap()
).unwrap();

const makeApprover = (id: string, name: string, email: string) =>
    Approver.create({
        id: Id.fromString(id),
        name: Name.create(name).unwrap(),
        email: Email.create(email).unwrap(),
    }).unwrap();

const makeApproval = (approverId: string, comment: string | null = null) =>
    Approval.create({
        approverId: Id.fromString(approverId),
        comment,
    }).unwrap();

const makeGroup = (
    approvers: { id: string; name: string; email: string }[],
    approvals: { approverId: string; comment: string | null }[] = []
) =>
    Group.create({
        requiredApprovals: 1,
        approvers: approvers.map((a) => makeApprover(a.id, a.name, a.email)),
        approvals: approvals.map((a) => makeApproval(a.approverId, a.comment)),
    }).unwrap();

const makeStep = (order: number, groups: Group[]) =>
    Step.create({ order: Order.create(order).unwrap(), groups }).unwrap();

describe('createAuthflow', () => {
    it('should create an authflow successfully with all steps approved', () => {
        const steps: Step[] = [
            makeStep(0, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    [{ approverId: '1', comment: 'Approved' }]
                ),
            ]),
            makeStep(1, [
                makeGroup(
                    [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                    [{ approverId: '2', comment: 'Approved' }]
                ),
            ]),
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
            makeStep(0, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    [{ approverId: '1', comment: 'Approved' }]
                ),
            ]),
            makeStep(1, [
                makeGroup(
                    [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                    []
                ),
            ]),
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
            makeStep(0, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    []
                ),
            ]),
            makeStep(1, [
                makeGroup(
                    [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                    []
                ),
            ]),
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
            makeStep(1, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    [{ approverId: '1', comment: 'Approved' }]
                ),
            ]),
            makeStep(1, [
                makeGroup(
                    [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                    [{ approverId: '2', comment: 'Approved' }]
                ),
            ]),
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
            makeStep(0, []),
            makeStep(0, []),
            makeStep(0, []),
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
            makeStep(0, []),
            makeStep(1, []),
            makeStep(0, []),
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
            makeStep(0, []),
            makeStep(1, []),
            makeStep(2, []),
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
            makeStep(5, []),
            makeStep(10, []),
            makeStep(15, []),
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
            makeStep(0, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    [{ approverId: '1', comment: 'Approved' }]
                ),
            ]),
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
            makeStep(0, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    []
                ),
            ]),
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
            makeStep(0, []),
            makeStep(1, []),
            makeStep(2, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    []
                ),
            ]),
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
            makeStep(0, [
                makeGroup(
                    [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                    []
                ),
            ]),
            makeStep(1, []),
            makeStep(2, []),
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
        const steps: Step[] = [makeStep(0, [])];

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
            makeStep(0, [
                makeGroup(
                    [
                        { id: '1', name: 'Alice', email: 'alice@example.com' },
                        { id: '2', name: 'Bob', email: 'bob@example.com' },
                    ],
                    [
                        { approverId: '1', comment: 'Approved' },
                        { approverId: '2', comment: 'Approved' },
                    ]
                ),
            ]),
            makeStep(1, [
                makeGroup(
                    [
                        {
                            id: '3',
                            name: 'Charlie',
                            email: 'charlie@example.com',
                        },
                    ],
                    [{ approverId: '3', comment: null }]
                ),
            ]),
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
        const steps: Step[] = [makeStep(9999, []), makeStep(9999, [])];

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
    const makeAuthflow = (action: string): Authflow =>
        Authflow.create({
            action: Action.create(action).unwrap(),
            range: testRange,
            steps: [],
        }).unwrap();

    it('should find an authflow by action', () => {
        const submitFlow = makeAuthflow('submit');
        const reviewFlow = makeAuthflow('review');
        const authflows = [submitFlow, reviewFlow];

        const found = authflows.find((a) =>
            a.action.equals(Action.create('review').unwrap())
        );

        expect(found).toBeDefined();
        expect(found!.id.toPlain()).toBe(reviewFlow.id.toPlain());
    });

    it('should return the first matching authflow', () => {
        const submitFlow = makeAuthflow('submit');
        const reviewFlow = makeAuthflow('review');
        const approveFlow = makeAuthflow('approve');
        const authflows = [submitFlow, reviewFlow, approveFlow];

        const found = authflows.find((a) =>
            a.action.equals(Action.create('submit').unwrap())
        );

        expect(found).toBeDefined();
        expect(found!.id.toPlain()).toBe(submitFlow.id.toPlain());
    });

    it('should return undefined when action is not found', () => {
        const submitFlow = makeAuthflow('submit');
        const reviewFlow = makeAuthflow('review');
        const authflows = [submitFlow, reviewFlow];

        const found = authflows.find((a) =>
            a.action.equals(Action.create('non-existent').unwrap())
        );

        expect(found).toBeUndefined();
    });

    it('should return undefined when authflows array is empty', () => {
        const found: Authflow | undefined = ([] as Authflow[]).find((a) =>
            a.action.equals(Action.create('submit').unwrap())
        );

        expect(found).toBeUndefined();
    });

    it('should treat action names as case-sensitive', () => {
        const authflows = [makeAuthflow('Submit')];

        const found = authflows.find((a) =>
            a.action.equals(Action.create('submit').unwrap())
        );

        expect(found).toBeUndefined();
    });
});

describe('approveAuthflow', () => {
    const approval1 = Approval.create({
        approverId: Id.fromString('approver-1'),
        comment: null,
    }).unwrap();
    const approval2 = Approval.create({
        approverId: Id.fromString('approver-2'),
        comment: null,
    }).unwrap();

    const approver1Plain = {
        id: 'approver-1',
        name: 'Alice',
        email: 'alice@example.com',
    };

    const makeTestGroup = (
        approvers: { id: string; name: string; email: string }[],
        approved: boolean
    ) =>
        Group.create({
            requiredApprovals: 1,
            approvers: approvers.map((a) =>
                makeApprover(a.id, a.name, a.email)
            ),
            approvals: approved ? approvers.map((a) => makeApproval(a.id)) : [],
        }).unwrap();

    const makeTestAuthflow = (action: string, steps: Step[]): Authflow =>
        Authflow.create({
            action: Action.create(action).unwrap(),
            range: testRange,
            steps,
        }).unwrap();

    it('should approve the first unapproved step', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);

        const result = authflow.apply(approval1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.isApproved).toBe(true);
        expect(updated.steps[0].isApproved).toBe(true);
    });

    it('should approve only the current step and leave later steps unapproved', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeStep(0, [group1]);
        const step2 = makeStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);

        const result = authflow.apply(approval1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.steps[0].isApproved).toBe(true);
        expect(updated.steps[1].isApproved).toBe(false);
        expect(updated.isApproved).toBe(false);
    });

    it('should fully approve authflow when last step is approved', () => {
        const group1 = makeTestGroup([approver1Plain], true);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeStep(0, [group1]);
        const step2 = makeStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);

        const result = authflow.apply(approval1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.isApproved).toBe(true);
    });

    it('should fail when all steps are already approved', () => {
        const group = makeTestGroup([approver1Plain], true);
        const step = makeStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);

        const result = authflow.apply(approval1);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
        );
    });

    it('should fail when approver is not in any group', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);

        const result = authflow.apply(approval2);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should support sequential approvals across steps', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeStep(0, [group1]);
        const step2 = makeStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);

        // First approval
        const result1 = authflow.apply(approval1);

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.isApproved).toBe(false);

        // Second approval
        const result2 = afterFirst.apply(approval1);

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.isApproved).toBe(true);
    });

    it('should preserve authflow id after approval', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);

        const result = authflow.apply(approval1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.id.toPlain()).toBe(authflow.id.toPlain());
    });

    it('should preserve step and group ids after approval', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);

        const result = authflow.apply(approval1);

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.steps[0].id.toPlain()).toBe(step.id.toPlain());
        expect(updated.steps[0].groups[0].id.toPlain()).toBe(
            group.id.toPlain()
        );
    });

    it('should preserve all ids across sequential approvals', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeStep(0, [group1]);
        const step2 = makeStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);

        const result1 = authflow.apply(approval1);

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.id.toPlain()).toBe(authflow.id.toPlain());
        expect(afterFirst.steps[0].id.toPlain()).toBe(step1.id.toPlain());
        expect(afterFirst.steps[1].id.toPlain()).toBe(step2.id.toPlain());

        const result2 = afterFirst.apply(approval1);

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.id.toPlain()).toBe(authflow.id.toPlain());
        expect(afterSecond.steps[0].id.toPlain()).toBe(step1.id.toPlain());
        expect(afterSecond.steps[1].id.toPlain()).toBe(step2.id.toPlain());
    });

    it('should preserve the action name after approval', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);

        const result = authflow.apply(approval1);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().action.toPlain()).toBe('submit');
    });
});
