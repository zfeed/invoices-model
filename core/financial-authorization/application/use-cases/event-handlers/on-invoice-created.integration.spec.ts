import { InMemoryDocumentStorage } from '../../../../../infrastructure/storage/in-memory.document-storage';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { InMemoryUnitOfWorkFactory } from '../../../../../infrastructure/unit-of-work/in-memory.unit-of-work';
import { CreateDraftInvoice } from '../../../../invoices/application/use-cases/commands/create-draft-invoice';
import { CompleteDraftInvoice } from '../../../../invoices/application/use-cases/commands/complete-draft-invoice';
import { ISSUER_TYPE } from '../../../../invoices/domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../../invoices/domain/recipient/recipient';
import { onInvoiceCreated } from './on-invoice-created';

const COMPLETE_DRAFT_REQUEST = {
    lineItems: [
        {
            description: 'Consulting',
            price: { amount: '200', currency: 'USD' },
            quantity: '1',
        },
    ],
    vatRate: '10',
    issueDate: '2025-01-01',
    dueDate: '2025-02-01',
    issuer: {
        type: ISSUER_TYPE.COMPANY,
        name: 'Company Inc.',
        address: '123 Main St',
        taxId: 'TAX123',
        email: 'info@company.com',
    },
    recipient: {
        type: RECIPIENT_TYPE.INDIVIDUAL,
        name: 'Jane Smith',
        address: '456 Oak Ave',
        taxId: 'TAX456',
        email: 'jane@example.com',
        taxResidenceCountry: 'US',
        billing: {
            type: 'PAYPAL' as const,
            email: 'jane@paypal.com',
        },
    },
};

describe('CompleteDraftInvoice + onInvoiceCreated integration', () => {
    let unitOfWorkFactory: InMemoryUnitOfWorkFactory;
    let domainEvents: InMemoryDomainEvents;
    let documentStorage: InMemoryDocumentStorage;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;

    beforeEach(async () => {
        unitOfWorkFactory = new InMemoryUnitOfWorkFactory();
        domainEvents = new InMemoryDomainEvents();
        documentStorage = new InMemoryDocumentStorage();
        createCommand = new CreateDraftInvoice(unitOfWorkFactory, domainEvents);
        completeCommand = new CompleteDraftInvoice(
            unitOfWorkFactory,
            domainEvents
        );

        await onInvoiceCreated(domainEvents, documentStorage);
    });

    it('should create a financial document when a draft invoice is completed', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);

        const result = await documentStorage
            .findByReferenceId(invoice.id)
            .run();

        expect(result.isSome()).toBe(true);
        result.fold(
            () => fail('Expected financial document to exist'),
            (doc) => {
                expect(doc.referenceId).toBe(invoice.id);
                expect(doc.authflows).toHaveLength(0);
                expect(doc.version).toBe(1);
            }
        );
    });

    it('should use the invoice id as the financial document referenceId', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);

        const result = await documentStorage
            .findByReferenceId(invoice.id)
            .run();

        result.fold(
            () => fail('Expected financial document to exist'),
            (doc) => {
                expect(doc.referenceId).toBe(invoice.id);
            }
        );
    });

    it('should not create a financial document for the draft invoice id', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        await completeCommand.execute(draft.id);

        const result = await documentStorage.findByReferenceId(draft.id).run();

        expect(result.isNone()).toBe(true);
    });

    it('should create separate financial documents for each completed invoice', async () => {
        const draft1 = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const draft2 = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

        const invoice1 = await completeCommand.execute(draft1.id);
        const invoice2 = await completeCommand.execute(draft2.id);

        const result1 = await documentStorage
            .findByReferenceId(invoice1.id)
            .run();
        const result2 = await documentStorage
            .findByReferenceId(invoice2.id)
            .run();

        expect(result1.isSome()).toBe(true);
        expect(result2.isSome()).toBe(true);

        const docId1 = result1.fold(
            () => null,
            (doc) => doc.id
        );
        const docId2 = result2.fold(
            () => null,
            (doc) => doc.id
        );

        expect(docId1).not.toBe(docId2);
    });

    it('should not create a financial document when draft creation does not trigger InvoiceCreatedEvent', async () => {
        await createCommand.execute(COMPLETE_DRAFT_REQUEST);

        const result = await documentStorage.findByReferenceId('any-ref').run();

        expect(result.isNone()).toBe(true);
    });

    it('should not create a financial document before the draft is completed', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

        const result = await documentStorage.findByReferenceId(draft.id).run();

        expect(result.isNone()).toBe(true);
    });
});
