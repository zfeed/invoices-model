import { InMemoryDocumentStorage } from '../../../../../infrastructure/storage/in-memory.document-storage';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { InvoiceCreatedEvent } from '../../../../invoices/domain/invoice/events/invoice-created.event';
import { createDocument } from '../../../domain/document/document';
import { onInvoiceCreated } from './on-invoice-created';

const createInvoiceEvent = (id: string) =>
    new InvoiceCreatedEvent({
        id,
        lineItems: {
            items: [
                {
                    description: 'Service',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                    total: { amount: '100', currency: 'USD' },
                },
            ],
            subtotal: { amount: '100', currency: 'USD' },
        },
        total: { amount: '100', currency: 'USD' },
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

const publishEvent = async (
    domainEvents: InMemoryDomainEvents,
    event: InvoiceCreatedEvent
) => {
    await domainEvents.publishEvents({ events: [event] });
};

describe('onInvoiceCreated', () => {
    it('should create a new financial document when invoice is created', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await storage.findByReferenceId('INV-001').run();

        expect(result.isSome()).toBe(true);
        result.fold(
            () => fail('Expected document to exist'),
            (doc) => {
                expect(doc.referenceId).toBe('INV-001');
                expect(doc.authflows).toHaveLength(0);
            }
        );
    });

    it('should create documents with different referenceIds for different invoices', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));
        await publishEvent(domainEvents, createInvoiceEvent('INV-002'));

        const result1 = await storage.findByReferenceId('INV-001').run();
        const result2 = await storage.findByReferenceId('INV-002').run();

        expect(result1.isSome()).toBe(true);
        expect(result2.isSome()).toBe(true);

        const id1 = result1.fold(
            () => null,
            (doc) => doc.id
        );
        const id2 = result2.fold(
            () => null,
            (doc) => doc.id
        );

        expect(id1).not.toBe(id2);
    });

    it('should not create a duplicate document when invoice with same id is created twice', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const firstResult = await storage.findByReferenceId('INV-001').run();
        const firstId = firstResult.fold(
            () => null,
            (doc) => doc.id
        );

        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const secondResult = await storage.findByReferenceId('INV-001').run();
        const secondId = secondResult.fold(
            () => null,
            (doc) => doc.id
        );

        expect(firstId).toBe(secondId);
    });

    it('should not create a document when no event is published', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);

        const result = await storage.findByReferenceId('INV-001').run();

        expect(result.isNone()).toBe(true);
    });

    it('should create a document with version 1 after save', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await storage.findByReferenceId('INV-001').run();

        result.fold(
            () => fail('Expected document to exist'),
            (doc) => {
                expect(doc.version).toBe(1);
            }
        );
    });

    it('should not modify an existing document version on duplicate event', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await storage.findByReferenceId('INV-001').run();

        result.fold(
            () => fail('Expected document to exist'),
            (doc) => {
                expect(doc.version).toBe(1);
            }
        );
    });

    it('should use event data id as the document referenceId', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(
            domainEvents,
            createInvoiceEvent('my-custom-ref-123')
        );

        const result = await storage
            .findByReferenceId('my-custom-ref-123')
            .run();

        expect(result.isSome()).toBe(true);
        result.fold(
            () => fail('Expected document to exist'),
            (doc) => {
                expect(doc.referenceId).toBe('my-custom-ref-123');
            }
        );
    });

    it('should generate a unique document id for each new document', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));
        await publishEvent(domainEvents, createInvoiceEvent('INV-002'));
        await publishEvent(domainEvents, createInvoiceEvent('INV-003'));

        const ids = await Promise.all(
            ['INV-001', 'INV-002', 'INV-003'].map(async (ref) => {
                const result = await storage.findByReferenceId(ref).run();
                return result.fold(
                    () => null,
                    (doc) => doc.id
                );
            })
        );

        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);
    });

    it('should create a document with empty authflows', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await storage.findByReferenceId('INV-001').run();

        result.fold(
            () => fail('Expected document to exist'),
            (doc) => {
                expect(doc.authflows).toEqual([]);
            }
        );
    });

    it('should not overwrite a pre-existing document in storage', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        const existing = createDocument({
            referenceId: 'INV-001',
            authflows: [],
        }).unwrap();
        await storage.save(existing).run();

        await onInvoiceCreated(domainEvents, storage);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const result = await storage.findByReferenceId('INV-001').run();

        result.fold(
            () => fail('Expected document to exist'),
            (doc) => {
                expect(doc.id).toBe(existing.id);
            }
        );
    });

    it('should handle many events for different invoices', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage);

        const count = 50;
        for (let i = 0; i < count; i++) {
            await publishEvent(domainEvents, createInvoiceEvent(`INV-${i}`));
        }

        for (let i = 0; i < count; i++) {
            const result = await storage.findByReferenceId(`INV-${i}`).run();
            expect(result.isSome()).toBe(true);
        }
    });

    it('should only react to events published after subscription', async () => {
        const storage = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await publishEvent(domainEvents, createInvoiceEvent('INV-BEFORE'));

        await onInvoiceCreated(domainEvents, storage);

        await publishEvent(domainEvents, createInvoiceEvent('INV-AFTER'));

        const before = await storage.findByReferenceId('INV-BEFORE').run();
        const after = await storage.findByReferenceId('INV-AFTER').run();

        expect(before.isNone()).toBe(true);
        expect(after.isSome()).toBe(true);
    });

    it('should isolate documents across separate storage instances', async () => {
        const storage1 = new InMemoryDocumentStorage();
        const storage2 = new InMemoryDocumentStorage();
        const domainEvents = new InMemoryDomainEvents();

        await onInvoiceCreated(domainEvents, storage1);
        await publishEvent(domainEvents, createInvoiceEvent('INV-001'));

        const inStorage1 = await storage1.findByReferenceId('INV-001').run();
        const inStorage2 = await storage2.findByReferenceId('INV-001').run();

        expect(inStorage1.isSome()).toBe(true);
        expect(inStorage2.isNone()).toBe(true);
    });
});
