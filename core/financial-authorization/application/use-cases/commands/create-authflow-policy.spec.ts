import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { InMemoryPolicyStorage } from '../../../../../infrastructure/storage/in-memory.policy-storage';
import { createMoney } from '../../../domain/money/money';
import { createRange } from '../../../domain/range/range';
import { createAuthflowTemplate } from '../../../domain/authflow/authflow-template';
import { AuthflowPolicyCreatedEvent } from '../../../domain/authflow/events/authflow-policy-created.event';
import { createAuthflowPolicyCommand } from './create-authflow-policy';

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

describe('createAuthflowPolicyCommand', () => {
    it('should create and save a policy', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        const result = await command({
            action: 'approve-invoice',
            templates: [
                template('0', '999'),
                template('1000', '4999'),
                template('5000', '10000'),
            ],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().action).toBe('approve-invoice');
        expect(result.unwrap().templates).toHaveLength(3);
    });

    it('should persist the policy in storage', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        const result = await command({
            action: 'approve-invoice',
            templates: [template('0', '10000')],
        });

        const found = await policyStorage.findByAction('approve-invoice').run();

        expect(found.isSome()).toBe(true);
        found.fold(
            () => fail('Expected policy to exist'),
            (policy) => {
                expect(policy.id).toBe(result.unwrap().id);
            }
        );
    });

    it('should publish an AuthflowPolicyCreatedEvent', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        const published: AuthflowPolicyCreatedEvent[] = [];
        await domainEvents.subscribeToEvent(
            AuthflowPolicyCreatedEvent,
            async (event) => {
                published.push(event);
            }
        );

        await command({
            action: 'approve-invoice',
            templates: [template('0', '10000')],
        });

        expect(published).toHaveLength(1);
        expect(published[0]).toBeInstanceOf(AuthflowPolicyCreatedEvent);
        expect(published[0].data.action).toBe('approve-invoice');
    });

    it('should return an error when ranges overlap', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        const result = await command({
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

    it('should not persist the policy when validation fails', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        await command({
            action: 'approve-invoice',
            templates: [
                template('0', '5000'),
                template('3000', '10000'),
            ],
        });

        const found = await policyStorage.findByAction('approve-invoice').run();

        expect(found.isNone()).toBe(true);
    });

    it('should not publish events when validation fails', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        const published: AuthflowPolicyCreatedEvent[] = [];
        await domainEvents.subscribeToEvent(
            AuthflowPolicyCreatedEvent,
            async (event) => {
                published.push(event);
            }
        );

        await command({
            action: 'approve-invoice',
            templates: [
                template('0', '5000'),
                template('3000', '10000'),
            ],
        });

        expect(published).toHaveLength(0);
    });

    it('should return the saved policy with updated version', async () => {
        const policyStorage = new InMemoryPolicyStorage();
        const domainEvents = new InMemoryDomainEvents();
        const command = createAuthflowPolicyCommand(policyStorage, domainEvents);

        const result = await command({
            action: 'approve-invoice',
            templates: [template('0', '10000')],
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().version).toBe(1);
    });
});
