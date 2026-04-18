import { Approval } from '../approval/approval.ts';
import { Approver } from '../approver/approver.ts';
import { Email } from '../email/email.ts';
import { Group } from '../groups/group.ts';
import { Id } from '../id/id.ts';
import { Name } from '../name/name.ts';
import { Order } from '../order/order.ts';
import { Step } from './step.ts';

const makeApprover = (id: string, name: string, email: string) =>
    Approver.create({
        id: Id.fromString(id),
        name: Name.create(name).unwrap(),
        email: Email.create(email).unwrap(),
    }).unwrap();

const makeApproval = (approverId: string, comment: string | null) =>
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

describe('Step.create', () => {
    it('should create a step successfully with all groups approved', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                [{ approverId: '1', comment: 'Approved' }]
            ),
            makeGroup(
                [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                [{ approverId: '2', comment: 'Approved' }]
            ),
        ];

        const result = Step.create({
            order: Order.create(1).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(1);
        expect(step.isApproved).toBe(true);
        expect(step.groups).toHaveLength(2);
        expect(step.id).toBeDefined();
    });

    it('should create a step with isApproved false when some groups are not approved', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                [{ approverId: '1', comment: 'Approved' }]
            ),
            makeGroup([{ id: '2', name: 'Bob', email: 'bob@example.com' }], []),
        ];

        const result = Step.create({
            order: Order.create(0).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(2);
    });

    it('should create a step with isApproved false when all groups are not approved', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                []
            ),
            makeGroup([{ id: '2', name: 'Bob', email: 'bob@example.com' }], []),
        ];

        const result = Step.create({
            order: Order.create(2).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(2);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(2);
    });

    it('should create a step with empty groups array', () => {
        const groups: Group[] = [];

        const result = Step.create({
            order: Order.create(0).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.isApproved).toBe(true); // all([]) returns true
        expect(step.groups).toHaveLength(0);
    });

    it('should create a step successfully with order 0', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                [{ approverId: '1', comment: 'Approved' }]
            ),
        ];

        const result = Step.create({
            order: Order.create(0).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.isApproved).toBe(true);
    });

    it('should create a step successfully with large order number', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                []
            ),
        ];

        const result = Step.create({
            order: Order.create(9999).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(9999);
        expect(step.isApproved).toBe(false);
    });

    it('should create a step with single approved group', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                [{ approverId: '1', comment: 'Approved' }]
            ),
        ];

        const result = Step.create({
            order: Order.create(5).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(5);
        expect(step.isApproved).toBe(true);
        expect(step.groups).toHaveLength(1);
    });

    it('should create a step with single non-approved group', () => {
        const groups = [
            makeGroup(
                [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                    { id: '2', name: 'Bob', email: 'bob@example.com' },
                ],
                []
            ),
        ];

        const result = Step.create({
            order: Order.create(3).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(3);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(1);
    });

    it('should create a step with multiple groups where only the last is not approved', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                [{ approverId: '1', comment: 'Approved' }]
            ),
            makeGroup(
                [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                [{ approverId: '2', comment: 'Approved' }]
            ),
            makeGroup(
                [{ id: '3', name: 'Charlie', email: 'charlie@example.com' }],
                []
            ),
        ];

        const result = Step.create({
            order: Order.create(1).unwrap(),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(1);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(3);
    });

    it('should generate a unique ID for each step', () => {
        const groups = [
            makeGroup(
                [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
                [{ approverId: '1', comment: 'Approved' }]
            ),
        ];

        const result1 = Step.create({
            order: Order.create(0).unwrap(),
            groups,
        });

        const result2 = Step.create({
            order: Order.create(1).unwrap(),
            groups,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const step1 = result1.unwrap();
        const step2 = result2.unwrap();

        expect(step1.id).toBeDefined();
        expect(step2.id).toBeDefined();
        expect(step1.id.toPlain()).not.toBe(step2.id.toPlain());
    });
});
