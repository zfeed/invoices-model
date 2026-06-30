import { Session } from '../../../building-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { defaultPersisters } from '../../../../platform/infrastructure/persistent-manager/default-persisters.ts';
import { createPgBossDomainEventsBus } from '../../../../platform/container/dependencies/pg-boss-domain-events-bus.ts';
import { DomainEventsBus } from '../../../building-blocks/interfaces/domain-events-bus/domain-events-bus.interface.ts';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event.ts';
import { Money } from '../../domain/money/money.ts';
import { Range } from '../../domain/range/range.ts';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template.ts';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy.ts';
import { Action } from '../../domain/action/action.ts';
import { FinancialDocument } from '../../domain/document/document.ts';
import { ReferenceId } from '../../domain/reference-id/reference-id.ts';
import { OnInvoiceIssued } from './on-invoice-issued.ts';
import { getTestKysely } from '../../../../../test/kysely.ts';
import { getTestLogger } from '../../../../../test/logger.ts';
import { getConfig } from '../../../../config.ts';
const kysely = getTestKysely();

// pg-boss delivers events through workers that poll the database, so each
// test must wait for the document to materialize rather than reading it back
// synchronously. The slowest case publishes many events, so give the tests a
// generous timeout.
const TEST_TIMEOUT = 60_000;

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
    domainEventsBus: DomainEventsBus,
    event: InvoiceIssuedEvent
) => {
    await domainEventsBus.publishEvents({ events: [event] });
};

const findDocument = async (session: Session, referenceId: string) => {
    await using uow = await session.begin();
    return await uow
        .collection(FinancialDocument)
        .findBy('referenceId', referenceId);
};

const waitForDocument = (
    session: Session,
    referenceId: string,
    timeout = 30_000
) =>
    vi.waitUntil(() => findDocument(session, referenceId), {
        timeout,
        interval: 100,
    });

describe('onInvoiceIssued', () => {
    const buses: { stop(): Promise<void> }[] = [];

    const startBus = async () => {
        const bus = createPgBossDomainEventsBus(getTestLogger(), getConfig());
        buses.push(bus);
        await bus.start();
        return bus;
    };

    afterEach(async () => {
        await Promise.all(buses.map((bus) => bus.stop()));
        buses.length = 0;
    });

    it(
        'should create a new financial document when invoice is created',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

            const result = await waitForDocument(session, 'INV-001');

            expect(result.referenceId.toPlain()).toBe('INV-001');
        },
        TEST_TIMEOUT
    );

    it(
        'should create a document with an authflow selected from the policy',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(
                domainEventsBus,
                createInvoiceEvent('INV-001', '500')
            );

            const result = await waitForDocument(session, 'INV-001');

            expect(result.authflows).toHaveLength(1);
            expect(result.authflows[0].action.toPlain()).toBe('pay');
            expect(result.authflows[0].range.from.amount).toBe('0');
            expect(result.authflows[0].range.to.amount).toBe('999');
        },
        TEST_TIMEOUT
    );

    it(
        'should select the correct authflow range for the invoice amount',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(
                domainEventsBus,
                createInvoiceEvent('INV-001', '5000')
            );

            const result = await waitForDocument(session, 'INV-001');

            expect(result.authflows).toHaveLength(1);
            expect(result.authflows[0].range.from.amount).toBe('1000');
            expect(result.authflows[0].range.to.amount).toBe('9999');
        },
        TEST_TIMEOUT
    );

    it(
        'should create a document with empty authflows when no policy exists',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

            const result = await waitForDocument(session, 'INV-001');

            expect(result.authflows).toEqual([]);
        },
        TEST_TIMEOUT
    );

    it(
        'should create a document with empty authflows when amount is outside policy ranges',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(
                domainEventsBus,
                createInvoiceEvent('INV-001', '999999')
            );

            const result = await waitForDocument(session, 'INV-001');

            expect(result.authflows).toEqual([]);
        },
        TEST_TIMEOUT
    );

    it(
        'should create documents with different referenceIds for different invoices',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));
            await publishEvent(domainEventsBus, createInvoiceEvent('INV-002'));

            const result1 = await waitForDocument(session, 'INV-001');
            const result2 = await waitForDocument(session, 'INV-002');

            expect(result1.id.toPlain()).not.toBe(result2.id.toPlain());
        },
        TEST_TIMEOUT
    );

    it(
        'should not create a duplicate document when invoice with same id is created twice',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

            const firstResult = await waitForDocument(session, 'INV-001');
            const firstId = firstResult.id.toPlain();

            await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

            const secondResult = await waitForDocument(session, 'INV-001');
            const secondId = secondResult.id.toPlain();

            expect(firstId).toBe(secondId);
        },
        TEST_TIMEOUT
    );

    it(
        'should not create a document when no event is published',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();

            const result = await findDocument(session, 'INV-001');

            expect(result).toBeUndefined();
        },
        TEST_TIMEOUT
    );

    it(
        'should use event data id as the document referenceId',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();
            await publishEvent(
                domainEventsBus,
                createInvoiceEvent('my-custom-ref-123')
            );

            const result = await waitForDocument(session, 'my-custom-ref-123');

            expect(result.referenceId.toPlain()).toBe('my-custom-ref-123');
        },
        TEST_TIMEOUT
    );

    it(
        'should generate a unique document id for each new document',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
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
                    const result = await waitForDocument(session, ref);
                    return result.id.toPlain();
                })
            );

            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(3);
        },
        TEST_TIMEOUT
    );

    it(
        'should not overwrite a pre-existing document in storage',
        async () => {
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
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

            const result = await waitForDocument(session, 'INV-001');

            expect(result.id.toPlain()).toBe(existing.id.toPlain());
        },
        TEST_TIMEOUT
    );

    it(
        'should deliver events published before the worker is registered',
        async () => {
            // pg-boss queues are durable: an event published before its worker is
            // registered is retained and delivered once the worker comes online.
            const domainEventsBus = await startBus();
            const session = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session);
            await publishEvent(
                domainEventsBus,
                createInvoiceEvent('INV-BEFORE')
            );

            const handler = new OnInvoiceIssued(session, domainEventsBus);
            await handler.register();

            await publishEvent(
                domainEventsBus,
                createInvoiceEvent('INV-AFTER')
            );

            const before = await waitForDocument(session, 'INV-BEFORE');
            const after = await waitForDocument(session, 'INV-AFTER');

            expect(before).toBeDefined();
            expect(after).toBeDefined();
        },
        TEST_TIMEOUT
    );

    it(
        'should see committed documents across separate session instances',
        async () => {
            const domainEventsBus = await startBus();
            const session1 = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );
            const session2 = new Session(
                new PersistentManager(
                    kysely,
                    domainEventsBus,
                    defaultPersisters
                )
            );

            await seedPolicy(session1);
            const handler = new OnInvoiceIssued(session1, domainEventsBus);
            await handler.register();
            await publishEvent(domainEventsBus, createInvoiceEvent('INV-001'));

            const inSession1 = await waitForDocument(session1, 'INV-001');
            const inSession2 = await findDocument(session2, 'INV-001');

            expect(inSession1).toBeDefined();
            expect(inSession2).toBeDefined();
        },
        TEST_TIMEOUT
    );
});
