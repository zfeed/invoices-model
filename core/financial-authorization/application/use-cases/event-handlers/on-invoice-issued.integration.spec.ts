import { InMemoryDocumentStorage } from '../../../../../infrastructure/storage/in-memory.document-storage';
import { InMemoryPolicyStorage } from '../../../../../infrastructure/storage/in-memory.policy-storage';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { InMemoryUnitOfWorkFactory } from '../../../../../infrastructure/unit-of-work/in-memory.unit-of-work';
import { CreateDraftInvoice } from '../../../../invoices/application/use-cases/commands/create-draft-invoice/create-draft-invoice';
import { CompleteDraftInvoice } from '../../../../invoices/application/use-cases/commands/complete-draft-invoice/complete-draft-invoice';
import { ISSUER_TYPE } from '../../../../invoices/domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../../invoices/domain/recipient/recipient';
import { createMoney } from '../../../domain/money/money';
import { createRange } from '../../../domain/range/range';
import { createAuthflowTemplate } from '../../../domain/authflow/authflow-template';
import { createAuthflowPolicy } from '../../../domain/authflow/authflow-policy';
import { onInvoiceIssued } from './on-invoice-issued';

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

const seedPolicy = async (policyStorage: InMemoryPolicyStorage) => {
    const policy = createAuthflowPolicy({
        action: 'pay',
        templates: [
            template('0', '999'),
            template('1000', '9999'),
        ],
    }).unwrap();
    await policyStorage.save(policy).run();
};

describe('CompleteDraftInvoice + onInvoiceIssued integration', () => {
    let unitOfWorkFactory: InMemoryUnitOfWorkFactory;
    let domainEvents: InMemoryDomainEvents;
    let documentStorage: InMemoryDocumentStorage;
    let policyStorage: InMemoryPolicyStorage;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;

    beforeEach(async () => {
        unitOfWorkFactory = new InMemoryUnitOfWorkFactory();
        domainEvents = new InMemoryDomainEvents();
        documentStorage = new InMemoryDocumentStorage();
        policyStorage = new InMemoryPolicyStorage();
        createCommand = new CreateDraftInvoice(unitOfWorkFactory, domainEvents);
        completeCommand = new CompleteDraftInvoice(
            unitOfWorkFactory,
            domainEvents
        );
    });

    describe('without policy', () => {
        beforeEach(async () => {
            await onInvoiceIssued(domainEvents, documentStorage, policyStorage);
        });

        it('should create a financial document with empty authflows when no policy exists', async () => {
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

        it('should not create a financial document for the draft invoice id', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            await completeCommand.execute(draft.id);

            const result = await documentStorage.findByReferenceId(draft.id).run();

            expect(result.isNone()).toBe(true);
        });

        it('should not create a financial document when draft creation does not trigger InvoiceIssuedEvent', async () => {
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

    describe('with policy', () => {
        beforeEach(async () => {
            await seedPolicy(policyStorage);
            await onInvoiceIssued(domainEvents, documentStorage, policyStorage);
        });

        it('should create a financial document with an authflow from the policy', async () => {
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
                    expect(doc.authflows).toHaveLength(1);
                    expect(doc.authflows[0].action).toBe('pay');
                    expect(doc.version).toBe(1);
                }
            );
        });

        it('should select the correct range for the invoice total', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(draft.id);

            const result = await documentStorage
                .findByReferenceId(invoice.id)
                .run();

            result.fold(
                () => fail('Expected financial document to exist'),
                (doc) => {
                    // invoice total is 220 (200 + 10% VAT), falls in 0-999
                    expect(doc.authflows[0].range.from.amount).toBe('0');
                    expect(doc.authflows[0].range.to.amount).toBe('999');
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
    });
});
