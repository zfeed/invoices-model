import { Action } from '../action/action';
import { AuthflowTemplate } from './authflow-template';
import { Money } from '../money/money';
import { Range } from '../range/range';

const testRange = Range.create(
    Money.create('0', 'USD').unwrap(),
    Money.create('100000', 'USD').unwrap()
).unwrap();

describe('authflowFromTemplate', () => {
    it('should create an authflow instance from a template with empty approvals', () => {
        const template = AuthflowTemplate.fromPlain({
            id: 'template-1',
            range: testRange.toPlain(),
            steps: [
                {
                    id: 'step-1',
                    order: 0,
                    groups: [
                        {
                            id: 'group-1',
                            approvers: [
                                {
                                    id: '1',
                                    name: 'Alice',
                                    email: 'alice@example.com',
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const result = template.toAuthflow(Action.fromPlain('approve-invoice'));

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(1);
        expect(authflow.steps[0].isApproved).toBe(false);
        expect(authflow.steps[0].groups[0].isApproved).toBe(false);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(0);
        expect(authflow.steps[0].groups[0].approvers).toHaveLength(1);
    });

    it('should create a new ID for the instance (not reuse template ID)', () => {
        const template = AuthflowTemplate.fromPlain({
            id: 'template-1',
            range: testRange.toPlain(),
            steps: [],
        });

        const result = template.toAuthflow(Action.fromPlain('approve-invoice'));

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.id).toBeDefined();
        expect(authflow.id.toPlain()).not.toBe('template-1');
    });

    it('should handle template with multiple steps and groups', () => {
        const template = AuthflowTemplate.fromPlain({
            id: 'template-1',
            range: testRange.toPlain(),
            steps: [
                {
                    id: 'step-1',
                    order: 0,
                    groups: [
                        {
                            id: 'group-1',
                            approvers: [
                                {
                                    id: '1',
                                    name: 'Alice',
                                    email: 'alice@example.com',
                                },
                            ],
                        },
                        {
                            id: 'group-2',
                            approvers: [
                                {
                                    id: '2',
                                    name: 'Bob',
                                    email: 'bob@example.com',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'step-2',
                    order: 1,
                    groups: [
                        {
                            id: 'group-3',
                            approvers: [
                                {
                                    id: '3',
                                    name: 'Charlie',
                                    email: 'charlie@example.com',
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const result = template.toAuthflow(Action.fromPlain('approve-invoice'));

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.steps[0].groups).toHaveLength(2);
        expect(authflow.steps[1].groups).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(0);
        expect(authflow.steps[0].groups[1].approvals).toHaveLength(0);
        expect(authflow.steps[1].groups[0].approvals).toHaveLength(0);
    });

    it('should handle template with empty steps', () => {
        const template = AuthflowTemplate.fromPlain({
            id: 'template-1',
            range: testRange.toPlain(),
            steps: [],
        });

        const result = template.toAuthflow(Action.fromPlain('approve-invoice'));

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(0);
    });

    it('should preserve approvers from the template', () => {
        const template = AuthflowTemplate.fromPlain({
            id: 'template-1',
            range: testRange.toPlain(),
            steps: [
                {
                    id: 'step-1',
                    order: 0,
                    groups: [
                        {
                            id: 'group-1',
                            approvers: [
                                {
                                    id: '1',
                                    name: 'Alice',
                                    email: 'alice@example.com',
                                },
                                {
                                    id: '2',
                                    name: 'Bob',
                                    email: 'bob@example.com',
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const result = template.toAuthflow(Action.fromPlain('approve-invoice'));

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        const approvers = authflow.steps[0].groups[0].approvers;
        expect(approvers).toHaveLength(2);
        expect(approvers[0].id.toPlain()).toBe('1');
        expect(approvers[0].name.toPlain()).toBe('Alice');
        expect(approvers[1].id.toPlain()).toBe('2');
        expect(approvers[1].name.toPlain()).toBe('Bob');
    });

    it('should preserve step order from the template', () => {
        const template = AuthflowTemplate.fromPlain({
            id: 'template-1',
            range: testRange.toPlain(),
            steps: [
                { id: 'step-1', order: 5, groups: [] },
                { id: 'step-2', order: 10, groups: [] },
            ],
        });

        const result = template.toAuthflow(Action.fromPlain('approve-invoice'));

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.steps[0].order.toPlain()).toBe(5);
        expect(authflow.steps[1].order.toPlain()).toBe(10);
    });
});
