import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes';
import { Approver } from '../approver/approver';
import { Email } from '../email/email';
import { GroupTemplate } from '../groups/group-template';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { Name } from '../name/name';
import { Order } from '../order/order';
import { Range } from '../range/range';
import { StepTemplate } from '../step/step-template';
import { AuthflowTemplate } from './authflow-template';

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
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE
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
