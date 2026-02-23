import { Group } from '../groups/group';
import { Order } from '../order/order';
import { Step } from './step';

describe('Step.create', () => {
    it('should create a step successfully with all groups approved', () => {
        const groups = [
            Group.fromPlain({
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
            Group.fromPlain({
                id: 'group-2',
                isApproved: true,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [
                    {
                        approverId: '2',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(1),
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
            Group.fromPlain({
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
            Group.fromPlain({
                id: 'group-2',
                isApproved: false,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(0),
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
            Group.fromPlain({
                id: 'group-1',
                isApproved: false,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [],
            }),
            Group.fromPlain({
                id: 'group-2',
                isApproved: false,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(2),
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
            order: Order.fromPlain(0),
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
            Group.fromPlain({
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(0),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.isApproved).toBe(true);
    });

    it('should create a step successfully with large order number', () => {
        const groups = [
            Group.fromPlain({
                id: 'group-1',
                isApproved: false,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(9999),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(9999);
        expect(step.isApproved).toBe(false);
    });

    it('should create a step with single approved group', () => {
        const groups = [
            Group.fromPlain({
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(5),
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
            Group.fromPlain({
                id: 'group-1',
                isApproved: false,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                    { id: '2', name: 'Bob', email: 'bob@example.com' },
                ],
                approvals: [],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(3),
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
            Group.fromPlain({
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
            Group.fromPlain({
                id: 'group-2',
                isApproved: true,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [
                    {
                        approverId: '2',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
            Group.fromPlain({
                id: 'group-3',
                isApproved: false,
                approvers: [
                    { id: '3', name: 'Charlie', email: 'charlie@example.com' },
                ],
                approvals: [],
            }),
        ];

        const result = Step.create({
            order: Order.fromPlain(1),
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
            Group.fromPlain({
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date().toISOString(),
                        comment: 'Approved',
                    },
                ],
            }),
        ];

        const result1 = Step.create({
            order: Order.fromPlain(0),
            groups,
        });

        const result2 = Step.create({
            order: Order.fromPlain(1),
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
