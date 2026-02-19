import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createMoney } from '../money/money';
import { createRange } from '../range/range';
import { createAuthflowTemplate } from './authflow-template';
import { createAuthflowPolicy, selectAuthflow } from './authflow-policy';
import { StepTemplate } from '../step/step-template';

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

describe('selectAuthflow', () => {
    const steps: StepTemplate[] = [
        {
            id: 'step-1',
            order: 0,
            groups: [
                {
                    id: 'group-1',
                    approvers: [
                        { id: '1', name: 'Alice', email: 'alice@example.com' },
                    ],
                },
            ],
        },
    ];

    const templateWithSteps = (from: string, to: string) =>
        createAuthflowTemplate({
            range: range(from, to),
            steps,
        }).unwrap();

    const policy = createAuthflowPolicy({
        action: 'approve-invoice',
        templates: [
            templateWithSteps('0', '999'),
            templateWithSteps('1000', '4999'),
            templateWithSteps('5000', '10000'),
        ],
    }).unwrap();

    it('should select authflow for amount in first range', () => {
        const amount = createMoney('500', 'USD').unwrap();
        const result = selectAuthflow(policy, amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.range.from.amount).toBe('0');
        expect(authflow.range.to.amount).toBe('999');
    });

    it('should select authflow for amount in middle range', () => {
        const amount = createMoney('2500', 'USD').unwrap();
        const result = selectAuthflow(policy, amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.range.from.amount).toBe('1000');
        expect(authflow.range.to.amount).toBe('4999');
    });

    it('should select authflow for amount at range boundary (lower)', () => {
        const amount = createMoney('1000', 'USD').unwrap();
        const result = selectAuthflow(policy, amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.range.from.amount).toBe('1000');
        expect(authflow.range.to.amount).toBe('4999');
    });

    it('should select authflow for amount at range boundary (upper)', () => {
        const amount = createMoney('4999', 'USD').unwrap();
        const result = selectAuthflow(policy, amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.range.from.amount).toBe('1000');
        expect(authflow.range.to.amount).toBe('4999');
    });

    it('should fail when amount is outside all ranges', () => {
        const amount = createMoney('20000', 'USD').unwrap();
        const result = selectAuthflow(policy, amount);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND
        );
    });

    it('should fail when amount falls in a gap between ranges', () => {
        const gapPolicy = createAuthflowPolicy({
            action: 'approve-invoice',
            templates: [
                template('0', '100'),
                template('200', '300'),
            ],
        }).unwrap();

        const amount = createMoney('150', 'USD').unwrap();
        const result = selectAuthflow(gapPolicy, amount);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND
        );
    });

    it('should create an authflow instance with steps from the matched template', () => {
        const amount = createMoney('500', 'USD').unwrap();
        const result = selectAuthflow(policy, amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvers).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(0);
    });
});
