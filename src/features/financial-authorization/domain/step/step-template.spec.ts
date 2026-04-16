import { Approver } from '../approver/approver.ts';
import { Email } from '../email/email.ts';
import { GroupTemplate } from '../groups/group-template.ts';
import { Id } from '../id/id.ts';
import { Name } from '../name/name.ts';
import { Order } from '../order/order.ts';
import { StepTemplate } from './step-template.ts';

const makeApprover = (id: string, name: string, email: string) =>
    Approver.create({
        id: Id.fromString(id),
        name: Name.create(name).unwrap(),
        email: Email.create(email).unwrap(),
    }).unwrap();

describe('StepTemplate.create', () => {
    it('should create a step template successfully', () => {
        const groups = [
            GroupTemplate.create({
                requiredApprovals: 1,
                approvers: [makeApprover('1', 'Alice', 'alice@example.com')],
            }).unwrap(),
            GroupTemplate.create({
                requiredApprovals: 1,
                approvers: [makeApprover('2', 'Bob', 'bob@example.com')],
            }).unwrap(),
        ];

        const result = StepTemplate.create({
            order: Order.create(0).unwrap(),
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
            order: Order.create(0).unwrap(),
            groups: [],
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order.toPlain()).toBe(0);
        expect(step.groups).toHaveLength(0);
    });

    it('should create a step template with large order number', () => {
        const result = StepTemplate.create({
            order: Order.create(9999).unwrap(),
            groups: [],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().order.toPlain()).toBe(9999);
    });

    it('should generate a unique ID for each step template', () => {
        const result1 = StepTemplate.create({
            order: Order.create(0).unwrap(),
            groups: [],
        });
        const result2 = StepTemplate.create({
            order: Order.create(1).unwrap(),
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
            order: Order.create(0).unwrap(),
            groups: [],
        });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step).not.toHaveProperty('isApproved');
    });
});
