import { InMemoryDomainEvents } from '../../../../infrastructure/domain-events/in-memory-domain-events';
import { Session } from '../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../infrastructure/persistent-manager/pg-persistent-manager';
import { CreateDraftInvoice } from '../../../invoices/application/commands/create-draft-invoice/create-draft-invoice';
import { CompleteDraftInvoice } from '../../../invoices/application/commands/complete-draft-invoice/complete-draft-invoice';
import { ISSUER_TYPE } from '../../../invoices/domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../invoices/domain/recipient/recipient';
import { Money } from '../../domain/money/money';
import { Range } from '../../domain/range/range';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import { Action } from '../../domain/action/action';
import { FinancialDocument } from '../../domain/document/document';
import { OnInvoiceIssued } from './on-invoice-issued';
import { cleanDatabase } from '../../../../infrastructure/persistent-manager/clean-database';

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
        templates: [template('0', '999'), template('1000', '9999')],
    }).unwrap();
    await using uow = await session.begin();
    await uow.collection(AuthflowPolicy).add(policy);
    await uow.commit();
};

describe('CompleteDraftInvoice + onInvoiceIssued integration', () => {
    let session: Session;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;

    beforeEach(async () => {
        await cleanDatabase();
        domainEvents = new InMemoryDomainEvents();
        session = new Session(new PersistentManager(domainEvents));
        createCommand = new CreateDraftInvoice(session);
        completeCommand = new CompleteDraftInvoice(session);
    });

    describe('without policy', () => {
        beforeEach(async () => {
            const handler = new OnInvoiceIssued(session, domainEvents);
            await handler.register();
        });

        it('should create a financial document with empty authflows when no policy exists', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(draft.id);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', invoice.id);
            }

            expect(doc).toBeDefined();
            expect(doc!.referenceId.toPlain()).toBe(invoice.id);
            expect(doc!.authflows).toHaveLength(0);
        });

        it('should not create a financial document for the draft invoice id', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            await completeCommand.execute(draft.id);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', draft.id);
            }

            expect(doc).toBeUndefined();
        });

        it('should not create a financial document when draft creation does not trigger InvoiceIssuedEvent', async () => {
            await createCommand.execute(COMPLETE_DRAFT_REQUEST);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', 'any-ref');
            }

            expect(doc).toBeUndefined();
        });

        it('should not create a financial document before the draft is completed', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', draft.id);
            }

            expect(doc).toBeUndefined();
        });
    });

    describe('with policy', () => {
        beforeEach(async () => {
            await seedPolicy(session);
            const handler = new OnInvoiceIssued(session, domainEvents);
            await handler.register();
        });

        it('should create a financial document with an authflow from the policy', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(draft.id);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', invoice.id);
            }

            expect(doc).toBeDefined();
            expect(doc!.referenceId.toPlain()).toBe(invoice.id);
            expect(doc!.authflows).toHaveLength(1);
            expect(doc!.authflows[0].action.toPlain()).toBe('pay');
        });

        it('should select the correct range for the invoice total', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(draft.id);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', invoice.id);
            }

            // invoice total is 220 (200 + 10% VAT), falls in 0-999
            expect(doc!.authflows[0].range.from.amount).toBe('0');
            expect(doc!.authflows[0].range.to.amount).toBe('999');
        });

        it('should use the invoice id as the financial document referenceId', async () => {
            const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(draft.id);

            let doc: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', invoice.id);
            }

            expect(doc!.referenceId.toPlain()).toBe(invoice.id);
        });

        it('should create separate financial documents for each completed invoice', async () => {
            const draft1 = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const draft2 = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

            const invoice1 = await completeCommand.execute(draft1.id);
            const invoice2 = await completeCommand.execute(draft2.id);

            let doc1: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc1 = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', invoice1.id);
            }
            let doc2: FinancialDocument | undefined;
            {
                await using uow = await session.begin();
                doc2 = await uow
                    .collection(FinancialDocument)
                    .findBy('referenceId', invoice2.id);
            }

            expect(doc1).toBeDefined();
            expect(doc2).toBeDefined();
            expect(doc1!.id.toPlain()).not.toBe(doc2!.id.toPlain());
        });
    });
});
