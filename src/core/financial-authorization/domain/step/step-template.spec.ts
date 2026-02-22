import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { GroupTemplate } from '../groups/group-template';
import { createStepTemplate } from './step-template';

describe('createStepTemplate', () => {
    it('should create a step template successfully', () => {
        const groups: GroupTemplate[] = [
            {
                id: 'group-1',
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
            },
            {
                id: 'group-2',
                approvers: [
                    { id: '2', name: 'Bob', email: 'bob@example.com' },
                ],
            },
        ];

        const result = createStepTemplate({ order: 0, groups });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(0);
        expect(step.groups).toHaveLength(2);
        expect(step.id).toBeDefined();
    });

    it('should create a step template with empty groups array', () => {
        const result = createStepTemplate({ order: 0, groups: [] });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step.order).toBe(0);
        expect(step.groups).toHaveLength(0);
    });

    it('should fail to create a step template with negative order', () => {
        const groups: GroupTemplate[] = [
            {
                id: 'group-1',
                approvers: [
                    { id: '1', name: 'Alice', email: 'alice@example.com' },
                ],
            },
        ];

        const result = createStepTemplate({ order: -1, groups });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Step order must be non-negative');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE
        );
    });

    it('should create a step template with large order number', () => {
        const result = createStepTemplate({ order: 9999, groups: [] });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().order).toBe(9999);
    });

    it('should generate a unique ID for each step template', () => {
        const result1 = createStepTemplate({ order: 0, groups: [] });
        const result2 = createStepTemplate({ order: 1, groups: [] });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id).not.toBe(result2.unwrap().id);
    });

    it('should not have isApproved property', () => {
        const result = createStepTemplate({ order: 0, groups: [] });

        expect(result.isOk()).toBe(true);
        const step = result.unwrap();
        expect(step).not.toHaveProperty('isApproved');
    });
});
