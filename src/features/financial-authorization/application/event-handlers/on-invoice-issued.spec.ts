import { Session } from '../../../../shared/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../infrastructure/persistent-manager/pg-persistent-manager.ts';
import { EventOutboxStorage } from '../../../../infrastructure/event-outbox/event-outbox.ts';
import { InMemoryDomainEventsBus } from '../../../../infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event.ts';
import { Money } from '../../domain/money/money.ts';
import { Range } from '../../domain/range/range.ts';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template.ts';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy.ts';
import { Action } from '../../domain/action/action.ts';
import { FinancialDocument } from '../../domain/document/document.ts';
import { ReferenceId } from '../../domain/reference-id/reference-id.ts';
import { OnInvoiceIssued } from './on-invoice-issued.ts';
import { cleanDatabase } from '../../../../infrastructure/persistent-manager/clean-database.ts';
import { kysely } from '../../../../../database/kysely.ts';

const createInvoiceEvent = (id: string, amount = '100', currency = 'USD') =>
    InvoiceIssuedEvent.create({
        id,
        status: 'ISSUED',
        lineItems: {
            items: [
                {
                    description: 'Service',
                    price: { amount, currency },
                    quantity: '1',
                    total: { amount, currency },
                },
            ],
            subtotal: { amount, currency },
        },
        total: { amount, currency },
        vatRate: null,
        vatAmount: null,
        dueDate: '2026-03-01',
        issueDate: '2026-02-01',
        issuer: {
            type: 'COMPANY',
            name: 'Acme Corp',
            address: '123 Main St',
            taxId: 'TAX-001',
            email: 'acme@example.com',
        },
        recipient: {
            type: 'COMPANY',
            name: 'Client Inc',
            address: '456 Oak Ave',
            taxId: 'TAX-002',
            email: 'client@example.com',
            taxResidenceCountry: 'US',
            billing: {
                type: 'PAYPAL',
                data: { email: 'client@paypal.com' },
            },
        },
    });

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

const seedPolicy = async (session: Session) => {
    const policy = AuthflowPolicy.create({
        action: Action.create('pay').unwrap(),
        templates: [
            template('0', '999'),
            template('1000', '9999'),
            template('10000', '100000'),
        ],
    }).unwrap();
    await using uow = await session.begin();
    await uow.collection(AuthflowPolicy).add(policy);
    await uow.commit();
};

const publishEvent = async (
    domainEventsBus: InMemoryDomainEventsBus,
    event: InvoiceIssuedEvent
) => {
    await domainEventsBus.publishEvents({ events: [event] });
};

describe('onInvoiceIssued', () => {
    beforeEach(() => cleanDatabase(kysely));

    it('should create a new financial document when invoice is created', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result).toBeDefined();
        expect(result!.referenceId.toPlain()).toBe('INV-001');
    });

    it('should create a document with an authflow selected from the policy', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(
            domainEventsBus,
            createInvoiceEvent('INV-001', '500')
        );

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result!.authflows).toHaveLength(1);
        expect(result!.authflows[0].action.toPlain()).toBe('pay');
        expect(result!.authflows[0].range.from.amount).toBe('0');
        expect(result!.authflows[0].range.to.amount).toBe('999');
    });

    it('should select the correct authflow range for the invoice amount', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(
            domainEventsBus,
            createInvoiceEvent('INV-001', '5000')
        );

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result!.authflows).toHaveLength(1);
        expect(result!.authflows[0].range.from.amount).toBe('1000');
        expect(result!.authflows[0].range.to.amount).toBe('9999');
    });

    it('should create a document with empty authflows when no policy exists', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result!.authflows).toEqual([]);
    });

    it('should create a document with empty authflows when amount is outside policy ranges', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(
            domainEventsBus,
            createInvoiceEvent('INV-001', '999999')
        );

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result!.authflows).toEqual([]);
    });

    it('should create documents with different referenceIds for different invoices', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-002'));

        let result1: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result1 = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }
        let result2: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result2 = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-002');
        }

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();

        const id1 = result1?.id.toPlain();
        const id2 = result2?.id.toPlain();

        expect(id1).not.toBe(id2);
    });

    it('should not create a duplicate document when invoice with same id is created twice', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

        let firstResult: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            firstResult = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }
        const firstId = firstResult?.id.toPlain();

        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

        let secondResult: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            secondResult = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }
        const secondId = secondResult?.id.toPlain();

        expect(firstId).toBe(secondId);
    });

    it('should not create a document when no event is published', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result).toBeUndefined();
    });

    it('should use event data id as the document referenceId', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(
            domainEventsBus,
            createInvoiceEvent('my-custom-ref-123')
        );

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'my-custom-ref-123');
        }

        expect(result).toBeDefined();
        expect(result!.referenceId.toPlain()).toBe('my-custom-ref-123');
    });

    it('should generate a unique document id for each new document', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-002'));
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-003'));

        const ids = await Promise.all(
            ['INV-001', 'INV-002', 'INV-003'].map(async (ref) => {
                await using uow = await session.begin();
                const result = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', ref);
                return result?.id.toPlain();
            })
        );

        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);
    });

    it('should not overwrite a pre-existing document in storage', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        const existing = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-001').unwrap(),
            value: Money.create('100', 'USD').unwrap(),
            authflows: [],
        }).unwrap();
        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(existing);
            await uow.commit();
        }

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

        let result: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            result = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(result!.id.toPlain()).toBe(existing.id.toPlain());
    });

    it('should handle many events for different invoices', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();

        const count = 50;
        for (let i = 0; i < count; i++) {
            await publishEvent(domainEventsBus, createInvoiceEvent(`INV-${i}`));
        }

        for (let i = 0; i < count; i++) {
            let result: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                result = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', `INV-${i}`);
            }
            expect(result).toBeDefined();
        }
    });

    it('should only react to events published after subscription', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await publishEvent(domainEventsBus, createInvoiceEvent('INV-BEFORE'));

        await seedPolicy(session);
        const handler = new OnInvoiceIssued(session, domainEventsBus);
        await handler.register();

        await publishEvent(domainEventsBus, createInvoiceEvent('INV-AFTER'));

        let before: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            before = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-BEFORE');
        }
        let after: FinancialDocument | undefined;
        {
            await using uow = await session.begin();
            after = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-AFTER');
        }

        expect(before).toBeUndefined();
        expect(after).toBeDefined();
    });

    it('should see committed documents across separate session instances', async () => {
        const domainEventsBus = new InMemoryDomainEventsBus();
        const session1 = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        const session2 = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        await seedPolicy(session1);
        const handler = new OnInvoiceIssued(session1, domainEventsBus);
        await handler.register();
        await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

        let inSession1: FinancialDocument | undefined;
        {
            await using uow = await session1.begin();
            inSession1 = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }
        let inSession2: FinancialDocument | undefined;
        {
            await using uow = await session2.begin();
            inSession2 = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        }

        expect(inSession1).toBeDefined();
        expect(inSession2).toBeDefined();
    });
});
