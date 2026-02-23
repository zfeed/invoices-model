import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Money } from '../money/money';
import { Range } from '../range/range';
import { AuthflowTemplate } from './authflow-template';
import { AuthflowPolicy } from './authflow-policy';
import { StepTemplate } from '../step/step-template';
import { AuthflowPolicyCreatedEvent } from './events/authflow-policy-created.event';
import { Action } from '../action/action';

const range = (from: string, to: string) =>
    Range.create(
        Money.create(from, 'USD').unwrap(),
        Money.create(to, 'USD').unwrap()
    ).unwrap();

const template = (from: string, to: string) =>
    AuthflowTemplate.create({
        range: range(from, to),
        steps: [],
    }).unwrap();

describe('createAuthflowPolicy', () => {
    it('should create a policy with non-overlapping ranges', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [
                template('0', '1000'),
                template('1001', '5000'),
                template('5001', '10000'),
            ],
        });

        expect(result.isOk()).toBe(true);
        const policy = result.unwrap();
        expect(policy.action.toPlain()).toBe('approve-invoice');
        expect(policy.templates).toHaveLength(3);
        expect(policy.id).toBeDefined();
    });

    it('should create a policy with a single template', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [template('0', '100000')],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().templates).toHaveLength(1);
    });

    it('should create a policy with empty templates', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().templates).toHaveLength(0);
    });

    it('should create a policy with adjacent ranges (no gap, no overlap)', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [
                template('0', '999'),
                template('1000', '4999'),
                template('5000', '10000'),
            ],
        });

        expect(result.isOk()).toBe(true);
    });

    it('should fail when ranges overlap', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
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
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
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
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
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
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
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
        const result1 = AuthflowPolicy.create({
            action: Action.create('action-1').unwrap(),
            templates: [],
        });
        const result2 = AuthflowPolicy.create({
            action: Action.create('action-2').unwrap(),
            templates: [],
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id.toPlain()).not.toBe(result2.unwrap().id.toPlain());
    });

    it('should produce an AuthflowPolicyCreatedEvent', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [template('0', '1000')],
        });

        const policy = result.unwrap();
        expect(policy.events).toHaveLength(1);
        expect(policy.events[0]).toBeInstanceOf(AuthflowPolicyCreatedEvent);
    });

    it('should include policy data in the AuthflowPolicyCreatedEvent', () => {
        const result = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [
                template('0', '1000'),
                template('1001', '5000'),
            ],
        });

        const policy = result.unwrap();
        const event = policy.events[0];
        const plain = policy.toPlain();
        expect(event.data.id).toBe(plain.id);
        expect(event.data.action).toBe('approve-invoice');
        expect(event.data.templates).toEqual(plain.templates);
    });
});

describe('selectAuthflow', () => {
    const steps: StepTemplate[] = [
        StepTemplate.fromPlain({
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
        }),
    ];

    const templateWithSteps = (from: string, to: string) =>
        AuthflowTemplate.create({
            range: range(from, to),
            steps,
        }).unwrap();

    const policy = AuthflowPolicy.create({
        action: Action.create('approve-invoice').unwrap(),
        templates: [
            templateWithSteps('0', '999'),
            templateWithSteps('1000', '4999'),
            templateWithSteps('5000', '10000'),
        ],
    }).unwrap();

    it('should select authflow for amount in first range', () => {
        const amount = Money.create('500', 'USD').unwrap();
        const result = policy.selectAuthflow(amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action.toPlain()).toBe('approve-invoice');
        expect(authflow.range.from.amount).toBe('0');
        expect(authflow.range.to.amount).toBe('999');
    });

    it('should select authflow for amount in middle range', () => {
        const amount = Money.create('2500', 'USD').unwrap();
        const result = policy.selectAuthflow(amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.range.from.amount).toBe('1000');
        expect(authflow.range.to.amount).toBe('4999');
    });

    it('should select authflow for amount at range boundary (lower)', () => {
        const amount = Money.create('1000', 'USD').unwrap();
        const result = policy.selectAuthflow(amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.range.from.amount).toBe('1000');
        expect(authflow.range.to.amount).toBe('4999');
    });

    it('should select authflow for amount at range boundary (upper)', () => {
        const amount = Money.create('4999', 'USD').unwrap();
        const result = policy.selectAuthflow(amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.range.from.amount).toBe('1000');
        expect(authflow.range.to.amount).toBe('4999');
    });

    it('should fail when amount is outside all ranges', () => {
        const amount = Money.create('20000', 'USD').unwrap();
        const result = policy.selectAuthflow(amount);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND
        );
    });

    it('should fail when amount falls in a gap between ranges', () => {
        const gapPolicy = AuthflowPolicy.create({
            action: Action.create('approve-invoice').unwrap(),
            templates: [
                template('0', '100'),
                template('200', '300'),
            ],
        }).unwrap();

        const amount = Money.create('150', 'USD').unwrap();
        const result = gapPolicy.selectAuthflow(amount);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND
        );
    });

    it('should create an authflow instance with steps from the matched template', () => {
        const amount = Money.create('500', 'USD').unwrap();
        const result = policy.selectAuthflow(amount);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvers).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(0);
    });
});
