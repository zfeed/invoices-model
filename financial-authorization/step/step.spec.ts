import { DOMAIN_ERROR_CODE } from '../../building-blocks/errors/domain/domain-codes';
import { Group } from '../groups/group';
import { createStep } from './step';

describe('createStep', () => {
    it('should create a step successfully with all groups approved', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
            {
                id: 'group-2',
                isApproved: true,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [
                    {
                        approverId: '2',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 1,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(1);
        expect(step.isApproved).toBe(true);
        expect(step.groups).toHaveLength(2);
        expect(step.id).toBeDefined();
    });

    it('should create a step with isApproved false when some groups are not approved', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
            {
                id: 'group-2',
                isApproved: false,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 0,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(0);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(2);
    });

    it('should create a step with isApproved false when all groups are not approved', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: false,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [],
            },
            {
                id: 'group-2',
                isApproved: false,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 2,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(2);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(2);
    });

    it('should create a step with empty groups array', () => {
        const groups: Group[] = [];

        const result = createStep({
            id: 'step-1',
            order: 0,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(0);
        expect(step.isApproved).toBe(true); // all([]) returns true
        expect(step.groups).toHaveLength(0);
    });

    it('should fail to create a step with negative order number', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: -1,
            groups,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Step order must be non-negative');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE
        );
    });

    it('should fail to create a step with large negative order number', () => {
        const groups: Group[] = [];

        const result = createStep({
            id: 'step-1',
            order: -999,
            groups,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Step order must be non-negative');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE
        );
    });

    it('should create a step successfully with order 0', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 0,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(0);
        expect(step.isApproved).toBe(true);
    });

    it('should create a step successfully with large order number', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: false,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 9999,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(9999);
        expect(step.isApproved).toBe(false);
    });

    it('should create a step with single approved group', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 5,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(5);
        expect(step.isApproved).toBe(true);
        expect(step.groups).toHaveLength(1);
    });

    it('should create a step with single non-approved group', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: false,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                    { id: '2', name: 'Bob', email: 'bob@example.com' },
                ],
                approvals: [],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 3,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(3);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(1);
    });

    it('should create a step with multiple groups where only the last is not approved', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
            {
                id: 'group-2',
                isApproved: true,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
                approvals: [
                    {
                        approverId: '2',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
            {
                id: 'group-3',
                isApproved: false,
                approvers: [
                    { id: '3', name: 'Charlie', email: 'charlie@example.com' },
                ],
                approvals: [],
            },
        ];

        const result = createStep({
            id: 'step-1',
            order: 1,
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(1);
        expect(step.isApproved).toBe(false);
        expect(step.groups).toHaveLength(3);
    });

    it('should generate a unique ID for each step', () => {
        const groups: Group[] = [
            {
                id: 'group-1',
                isApproved: true,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
                approvals: [
                    {
                        approverId: '1',
                        createdAt: new Date(),
                        comment: 'Approved',
                    },
                ],
            },
        ];

        const result1 = createStep({
            id: 'step-1',
            order: 0,
            groups,
        });

        const result2 = createStep({
            id: 'step-2',
            order: 1,
            groups,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const step1 = result1.unwrap();
        const step2 = result2.unwrap();

        expect(step1.id).toBeDefined();
        expect(step2.id).toBeDefined();
        expect(step1.id).not.toBe(step2.id);
    });
});
