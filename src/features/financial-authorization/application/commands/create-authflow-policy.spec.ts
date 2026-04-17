import { KNOWN_ERROR_CODE } from '../../../../shared/errors/known-error-codes.ts';
import { InMemoryDomainEventsBus } from '../../../../infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { Session } from '../../../../shared/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../infrastructure/persistent-manager/pg-persistent-manager.ts';
import { EventOutboxStorage } from '../../../../infrastructure/event-outbox/event-outbox.ts';
import { Money } from '../../domain/money/money.ts';
import { Range } from '../../domain/range/range.ts';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template.ts';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy.ts';
import { AuthflowPolicyCreatedEvent } from '../../domain/authflow/events/authflow-policy-created.event.ts';
import { CreateAuthflowPolicy } from './create-authflow-policy.ts';
import { cleanDatabase } from '../../../../infrastructure/persistent-manager/clean-database.ts';
import { kysely } from '../../../../../database/kysely.ts';

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
    beforeEach(() => cleanDatabase(kysely));
    it('should create and save a policy', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
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
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
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
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        const command = new CreateAuthflowPolicy(session);

        const published: AuthflowPolicyCreatedEvent[] = [];
        await domainEventsBus.subscribeToEvent(
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
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        const command = new CreateAuthflowPolicy(session);

        await expect(
            command.execute({
                action: 'approve-invoice',
                templates: [template('0', '5000'), template('3000', '10000')],
            })
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP,
        });
    });

    it('should not persist the policy when validation fails', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
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
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        const command = new CreateAuthflowPolicy(session);

        const published: AuthflowPolicyCreatedEvent[] = [];
        await domainEventsBus.subscribeToEvent(
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
