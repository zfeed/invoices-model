import { GroupTemplate } from '../groups/group-template';
import { Order } from '../order/order';
import { StepTemplate } from './step-template';

describe('StepTemplate.create', () => {
    it('should create a step template successfully', () => {
        const groups = [
            GroupTemplate.fromPlain({
                id: 'group-1',
                requiredApprovals: 1,
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
            }),
            GroupTemplate.fromPlain({
                id: 'group-2',
                requiredApprovals: 1,
                approvers: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
            }),
        ];

        const result = StepTemplate.create({
            order: Order.fromPlain(0),
            groups,
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.groups).toHaveLength(2);
        expect(step.id).toBeDefined();
    });

    it('should create a step template with empty groups array', () => {
        const result = StepTemplate.create({
            order: Order.fromPlain(0),
            groups: [],
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.groups).toHaveLength(0);
    });

    it('should create a step template with large order number', () => {
        const result = StepTemplate.create({
            order: Order.fromPlain(9999),
            groups: [],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().order.toPlain()).toBe(9999);
    });

    it('should generate a unique ID for each step template', () => {
        const result1 = StepTemplate.create({
            order: Order.fromPlain(0),
            groups: [],
        });
        const result2 = StepTemplate.create({
            order: Order.fromPlain(1),
            groups: [],
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id.toPlain()).not.toBe(
            result2.unwrap().id.toPlain()
        );
    });

    it('should not have isApproved property', () => {
        const result = StepTemplate.create({
            order: Order.fromPlain(0),
            groups: [],
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step).not.toHaveProperty('isApproved');
    });
});
