import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createMoney } from '../money/money';
import { createRange } from '../range/range';
import { createAuthflowTemplate } from './authflow-template';
import { createAuthflowPolicy } from './authflow-policy';

const range = (from: string, to: string) =>
    createRange(
        createMoney(from, 'USD').unwrap(),
        createMoney(to, 'USD').unwrap()
    ).unwrap();

const template = (from: string, to: string) =>
    createAuthflowTemplate({
        range: range(from, to),
        steps: [],
    }).unwrap();

describe('createAuthflowPolicy', () => {
    it('should create a policy with non-overlapping ranges', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '1000'),
                template('1001', '5000'),
                template('5001', '10000'),
            ],
        });

        expect(result.isOk()).toBe(true);
        const policy = result.unwrap();
        expect(policy.action).toBe('approve-invoice');
        expect(policy.templates).toHaveLength(3);
        expect(policy.id).toBeDefined();
    });

    it('should create a policy with a single template', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [template('0', '100000')],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().templates).toHaveLength(1);
    });

    it('should create a policy with empty templates', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().templates).toHaveLength(0);
    });

    it('should create a policy with adjacent ranges (no gap, no overlap)', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '999'),
                template('1000', '4999'),
                template('5000', '10000'),
            ],
        });

        expect(result.isOk()).toBe(true);
    });

    it('should fail when ranges overlap', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '5000'),
                template('3000', '10000'),
            ],
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP
        );
    });

    it('should fail when ranges share a boundary point', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '5000'),
                template('5000', '10000'),
            ],
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP
        );
    });

    it('should fail when one range is contained within another', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '10000'),
                template('2000', '5000'),
            ],
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP
        );
    });

    it('should fail when identical ranges exist', () => {
        const result = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '5000'),
                template('0', '5000'),
            ],
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP
        );
    });

    it('should generate a unique ID for each policy', () => {
        const result1 = createAuthflowPolicy({
            action: 'action-1',
            templates: [],
        });
        const result2 = createAuthflowPolicy({
            action: 'action-2',
            templates: [],
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id).not.toBe(result2.unwrap().id);
    });
});
