import { UnitOfWorkFactory } from '../../../../infrastructure/unit-of-work/unit-of-work-factory';
import { InMemoryDomainEvents } from '../../../../infrastructure/domain-events/in-memory-domain-events';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event';
import { Money } from '../../domain/money/money';
import { Range } from '../../domain/range/range';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import { Action } from '../../domain/action/action';
import { FinancialDocument } from '../../domain/document/document';
import { ReferenceId } from '../../domain/reference-id/reference-id';
import { OnInvoiceIssued } from './on-invoice-issued';

const createInvoiceEvent = (id: string, amount = '100', currency = 'USD') =>
    new InvoiceIssuedEvent({
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

const seedPolicy = async (unitOfWorkFactory: UnitOfWorkFactory) => {
    const policy = AuthflowPolicy.create({
        action: Action.create('pay').unwrap(),
        templates: [
            template('0', '999'),
            template('1000', '9999'),
            template('10000', '100000'),
        ],
    }).unwrap();
    await unitOfWorkFactory.start(async (uow) => {
        await uow.collection(AuthflowPolicy).add(policy);
    });
};

const publishEvent = async (
    domainEvents: InMemoryDomainEvents,
    event: InvoiceIssuedEvent
) => {
    await domainEvents.publishEvents({ events: [event] });
};

describe('onInvoiceIssued', () => {
    it('should create a new financial document when invoice is created', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result).toBeDefined();
        expect(result!.referenceId.toPlain()).toBe('INV-001');
    });

    it('should create a document with an authflow selected from the policy', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001', '500'));

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result!.authflows).toHaveLength(1);
        expect(result!.authflows[0].action.toPlain()).toBe('pay');
        expect(result!.authflows[0].range.from.amount).toBe('0');
        expect(result!.authflows[0].range.to.amount).toBe('999');
    });

    it('should select the correct authflow range for the invoice amount', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001', '5000'));

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result!.authflows).toHaveLength(1);
        expect(result!.authflows[0].range.from.amount).toBe('1000');
        expect(result!.authflows[0].range.to.amount).toBe('9999');
    });

    it('should create a document with empty authflows when no policy exists', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result!.authflows).toEqual([]);
    });

    it('should create a document with empty authflows when amount is outside policy ranges', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(
            domainEvents,
            createInvoiceEvent('INV-001', '999999')
        );

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result!.authflows).toEqual([]);
    });

    it('should create documents with different referenceIds for different invoices', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));
        await publishEvent(domainEvents, createInvoiceEvent('INV-002'));

        const result1 = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });
        const result2 = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-002');
        });

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();

        const id1 = result1?.id.toPlain();
        const id2 = result2?.id.toPlain();

        expect(id1).not.toBe(id2);
    });

    it('should not create a duplicate document when invoice with same id is created twice', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const firstResult = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });
        const firstId = firstResult?.id.toPlain();

        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const secondResult = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });
        const secondId = secondResult?.id.toPlain();

        expect(firstId).toBe(secondId);
    });

    it('should not create a document when no event is published', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result).toBeUndefined();
    });

    it('should use event data id as the document referenceId', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(
            domainEvents,
            createInvoiceEvent('my-custom-ref-123')
        );

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'my-custom-ref-123');
        });

        expect(result).toBeDefined();
        expect(result!.referenceId.toPlain()).toBe('my-custom-ref-123');
    });

    it('should generate a unique document id for each new document', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));
        await publishEvent(domainEvents, createInvoiceEvent('INV-002'));
        await publishEvent(domainEvents, createInvoiceEvent('INV-003'));

        const ids = await Promise.all(
            ['INV-001', 'INV-002', 'INV-003'].map(async (ref) => {
                const result = await unitOfWorkFactory.start(async (uow) => {
                    return uow
                        .collection(FinancialDocument)
                        .findBy('referenceId', ref);
                });
                return result?.id.toPlain();
            })
        );

        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);
    });

    it('should not overwrite a pre-existing document in storage', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        const existing = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-001'),
            value: Money.create('100', 'USD').unwrap(),
            authflows: [],
        }).unwrap();
        await unitOfWorkFactory.start(async (uow) => {
            await uow.collection(FinancialDocument).add(existing);
        });

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(result!.id.toPlain()).toBe(existing.id.toPlain());
    });

    it('should handle many events for different invoices', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();

        const count = 50;
        for (let i = 0; i < count; i++) {
            await publishEvent(domainEvents, createInvoiceEvent(`INV-${i}`));
        }

        for (let i = 0; i < count; i++) {
            const result = await unitOfWorkFactory.start(async (uow) => {
                return uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', `INV-${i}`);
            });
            expect(result).toBeDefined();
        }
    });

    it('should only react to events published after subscription', async () => {
        const unitOfWorkFactory = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await publishEvent(domainEvents, createInvoiceEvent('INV-BEFORE'));

        await seedPolicy(unitOfWorkFactory);
        const handler = new OnInvoiceIssued(unitOfWorkFactory, domainEvents);
        await handler.register();

        await publishEvent(domainEvents, createInvoiceEvent('INV-AFTER'));

        const before = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-BEFORE');
        });
        const after = await unitOfWorkFactory.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-AFTER');
        });

        expect(before).toBeUndefined();
        expect(after).toBeDefined();
    });

    it('should isolate documents across separate UoW factory instances', async () => {
        const unitOfWorkFactory1 = new UnitOfWorkFactory();
        const unitOfWorkFactory2 = new UnitOfWorkFactory();
        const domainEvents = new InMemoryDomainEvents();

        await seedPolicy(unitOfWorkFactory1);
        const handler = new OnInvoiceIssued(unitOfWorkFactory1, domainEvents);
        await handler.register();
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const inFactory1 = await unitOfWorkFactory1.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });
        const inFactory2 = await unitOfWorkFactory2.start(async (uow) => {
            return uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'INV-001');
        });

        expect(inFactory1).toBeDefined();
        expect(inFactory2).toBeUndefined();
    });
});
