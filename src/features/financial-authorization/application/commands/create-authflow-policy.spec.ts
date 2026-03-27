import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes';
import { InMemoryDomainEvents } from '../../../../infrastructure/domain-events/in-memory-domain-events';
import { Session } from '../../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../infrastructure/persistent-manager/pg-persistent-manager';
import { EventOutboxStorage } from '../../../../infrastructure/event-outbox/event-outbox';
import { Money } from '../../domain/money/money';
import { Range } from '../../domain/range/range';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import { AuthflowPolicyCreatedEvent } from '../../domain/authflow/events/authflow-policy-created.event';
import { CreateAuthflowPolicy } from './create-authflow-policy';
import { cleanDatabase } from '../../../../infrastructure/persistent-manager/clean-database';

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

describe('createAuthflowPolicyCommand', () => {
    beforeEach(cleanDatabase);
    it('should create and save a policy', async () => {
        const domainEvents = new InMemoryDomainEvents();
        const session = new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        );
        const command = new CreateAuthflowPolicy(session);

        const policy = await command.execute({
            action: 'approve-invoice',
            templates: [
                template('0', '999'),
                template('1000', '4999'),
                template('5000', '10000'),
            ],
        });

        expect(policy.action).toBe('approve-invoice');
        expect(policy.templates).toHaveLength(3);
    });

    it('should persist the policy in storage', async () => {
        const domainEvents = new InMemoryDomainEvents();
        const session = new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        );
        const command = new CreateAuthflowPolicy(session);

        const policy = await command.execute({
            action: 'approve-invoice',
            templates: [template('0', '10000')],
        });

        {
            await using uow = await session.begin();
            const found = await uow
                .collection(AuthflowPolicy)
                .findBy('action', 'approve-invoice');
            expect(found).not.toBeUndefined();
            expect(found!.id.toPlain()).toBe(policy.id);
        }
    });

    it('should publish an AuthflowPolicyCreatedEvent', async () => {
        const domainEvents = new InMemoryDomainEvents();
        const session = new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        );
        const command = new CreateAuthflowPolicy(session);

        const published: AuthflowPolicyCreatedEvent[] = [];
        await domainEvents.subscribeToEvent(
            AuthflowPolicyCreatedEvent,
            async (event) => {
                published.push(event);
            }
        );

        await command.execute({
            action: 'approve-invoice',
            templates: [template('0', '10000')],
        });

        expect(published).toHaveLength(1);
        expect(published[0]).toBeInstanceOf(AuthflowPolicyCreatedEvent);
        expect(published[0].data.action).toBe('approve-invoice');
    });

    it('should throw when ranges overlap', async () => {
        const domainEvents = new InMemoryDomainEvents();
        const session = new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        );
        const command = new CreateAuthflowPolicy(session);

        await expect(
            command.execute({
                action: 'approve-invoice',
                templates: [template('0', '5000'), template('3000', '10000')],
            })
        ).rejects.toMatchObject({
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP,
        });
    });

    it('should not persist the policy when validation fails', async () => {
        const domainEvents = new InMemoryDomainEvents();
        const session = new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        );
        const command = new CreateAuthflowPolicy(session);

        await command
            .execute({
                action: 'approve-invoice',
                templates: [template('0', '5000'), template('3000', '10000')],
            })
            .catch(() => {});

        {
            await using uow = await session.begin();
            const found = await uow
                .collection(AuthflowPolicy)
                .findBy('action', 'approve-invoice');
            expect(found).toBeUndefined();
        }
    });

    it('should not publish events when validation fails', async () => {
        const domainEvents = new InMemoryDomainEvents();
        const session = new Session(
            new PersistentManager(domainEvents, EventOutboxStorage.create([]))
        );
        const command = new CreateAuthflowPolicy(session);

        const published: AuthflowPolicyCreatedEvent[] = [];
        await domainEvents.subscribeToEvent(
            AuthflowPolicyCreatedEvent,
            async (event) => {
                published.push(event);
            }
        );

        await command
            .execute({
                action: 'approve-invoice',
                templates: [template('0', '5000'), template('3000', '10000')],
            })
            .catch(() => {});

        expect(published).toHaveLength(0);
    });
});
