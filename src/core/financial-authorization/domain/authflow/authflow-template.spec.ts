import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Money } from '../money/money';
import { Range } from '../range/range';
import { StepTemplate } from '../step/step-template';
import { AuthflowTemplate } from './authflow-template';

const testRange = Range.create(
    Money.create('0', 'USD').unwrap(),
    Money.create('100000', 'USD').unwrap()
).unwrap();

describe('createAuthflowTemplate', () => {
    it('should create an authflow template successfully', () => {
        const steps: StepTemplate[] = [
            StepTemplate.fromPlain({
                id: 'step-1',
                order: 0,
                groups: [
                    {
                        id: 'group-1',
                        requiredApprovals: 1,
                        approvers: [
                            {
                                id: '1',
                                name: 'Alice',
                                email: 'alice@example.com',
                            },
                        ],
                    },
                ],
            }),
            StepTemplate.fromPlain({
                id: 'step-2',
                order: 1,
                groups: [
                    {
                        id: 'group-2',
                        requiredApprovals: 1,
                        approvers: [
                            {
                                id: '2',
                                name: 'Bob',
                                email: 'bob@example.com',
                            },
                        ],
                    },
                ],
            }),
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
            StepTemplate.fromPlain({ id: 'step-1', order: 0, groups: [] }),
            StepTemplate.fromPlain({ id: 'step-2', order: 0, groups: [] }),
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
            StepTemplate.fromPlain({ id: 'step-1', order: 5, groups: [] }),
            StepTemplate.fromPlain({ id: 'step-2', order: 10, groups: [] }),
            StepTemplate.fromPlain({ id: 'step-3', order: 15, groups: [] }),
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
        expect(result1.unwrap().id.toPlain()).not.toBe(result2.unwrap().id.toPlain());
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
