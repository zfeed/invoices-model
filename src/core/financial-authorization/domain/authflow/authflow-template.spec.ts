import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import { Approver } from '../approver/approver.ts';
import { Email } from '../email/email.ts';
import { GroupTemplate } from '../groups/group-template.ts';
import { Id } from '../id/id.ts';
import { Money } from '../money/money.ts';
import { Name } from '../name/name.ts';
import { Order } from '../order/order.ts';
import { Range } from '../range/range.ts';
import { StepTemplate } from '../step/step-template.ts';
import { AuthflowTemplate } from './authflow-template.ts';

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

describe('createAuthflowTemplate', () => {
    it('should create an authflow template successfully', () => {
        const steps: StepTemplate[] = [
            StepTemplate.create({
                order: Order.create(0).unwrap(),
                groups: [
                    GroupTemplate.create({
                        requiredApprovals: 1,
                        approvers: [
                            makeApprover('1', 'Alice', 'alice@example.com'),
                        ],
                    }).unwrap(),
                ],
            }).unwrap(),
            StepTemplate.create({
                order: Order.create(1).unwrap(),
                groups: [
                    GroupTemplate.create({
                        requiredApprovals: 1,
                        approvers: [
                            makeApprover('2', 'Bob', 'bob@example.com'),
                        ],
                    }).unwrap(),
                ],
            }).unwrap(),
        ];

        const result = AuthflowTemplate.create({
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const template = result.unwrap();
        expect(template.steps).toHaveLength(2);
        expect(template.id).toBeDefined();
    });

    it('should create an authflow template with empty steps', () => {
        const result = AuthflowTemplate.create({
            range: testRange,
            steps: [],
        });

        expect(result.isOk()).toBe(true);
        const template = result.unwrap();
        expect(template.steps).toHaveLength(0);
    });

    it('should fail with duplicate step orders', () => {
        const steps: StepTemplate[] = [
            StepTemplate.create({
                order: Order.create(0).unwrap(),
                groups: [],
            }).unwrap(),
            StepTemplate.create({
                order: Order.create(0).unwrap(),
                groups: [],
            }).unwrap(),
        ];

        const result = AuthflowTemplate.create({
            range: testRange,
            steps,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate step orders found');
        expect(error.code).toBe(
            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE
        );
    });

    it('should create an authflow template with non-sequential but unique orders', () => {
        const steps: StepTemplate[] = [
            StepTemplate.create({
                order: Order.create(5).unwrap(),
                groups: [],
            }).unwrap(),
            StepTemplate.create({
                order: Order.create(10).unwrap(),
                groups: [],
            }).unwrap(),
            StepTemplate.create({
                order: Order.create(15).unwrap(),
                groups: [],
            }).unwrap(),
        ];

        const result = AuthflowTemplate.create({
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const template = result.unwrap();
        expect(template.steps).toHaveLength(3);
    });

    it('should generate a unique ID for each authflow template', () => {
        const result1 = AuthflowTemplate.create({
            range: testRange,
            steps: [],
        });
        const result2 = AuthflowTemplate.create({
            range: testRange,
            steps: [],
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id.toPlain()).not.toBe(
            result2.unwrap().id.toPlain()
        );
    });

    it('should not have isApproved property', () => {
        const result = AuthflowTemplate.create({
            range: testRange,
            steps: [],
        });

        expect(result.isOk()).toBe(true);
        const template = result.unwrap();
        expect(template).not.toHaveProperty('isApproved');
    });
});
