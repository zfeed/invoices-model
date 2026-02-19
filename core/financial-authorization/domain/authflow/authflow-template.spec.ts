import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createMoney } from '../money/money';
import { createRange } from '../range/range';
import { StepTemplate } from '../step/step-template';
import { createAuthflowTemplate } from './authflow-template';

const testRange = createRange(
    createMoney('0', 'USD').unwrap(),
    createMoney('100000', 'USD').unwrap()
).unwrap();

describe('createAuthflowTemplate', () => {
    it('should create an authflow template successfully', () => {
        const steps: StepTemplate[] = [
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
            {
                id: 'step-2',
                order: 1,
                groups: [
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
        ];

        const result = createAuthflowTemplate({
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.id).toBeDefined();
    });

    it('should create an authflow template with empty steps', () => {
        const result = createAuthflowTemplate({
            range: testRange,
            steps: [],
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.steps).toHaveLength(0);
    });

    it('should fail with duplicate step orders', () => {
        const steps: StepTemplate[] = [
            { id: 'step-1', order: 0, groups: [] },
            { id: 'step-2', order: 0, groups: [] },
        ];

        const result = createAuthflowTemplate({
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
            { id: 'step-1', order: 5, groups: [] },
            { id: 'step-2', order: 10, groups: [] },
            { id: 'step-3', order: 15, groups: [] },
        ];

        const result = createAuthflowTemplate({
            range: testRange,
            steps,
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.steps).toHaveLength(3);
    });

    it('should generate a unique ID for each authflow template', () => {
        const result1 = createAuthflowTemplate({
            range: testRange,
            steps: [],
        });
        const result2 = createAuthflowTemplate({
            range: testRange,
            steps: [],
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id).not.toBe(result2.unwrap().id);
    });

    it('should not have isApproved property', () => {
        const result = createAuthflowTemplate({
            range: testRange,
            steps: [],
        });

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow).not.toHaveProperty('isApproved');
    });
});
