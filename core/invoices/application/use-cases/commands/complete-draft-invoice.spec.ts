import { InMemoryUnitOfWorkFactory } from '../../../../../infrastructure/unit-of-work/in-memory.unit-of-work';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { CreateDraftInvoice } from './create-draft-invoice';
import { CompleteDraftInvoice } from './complete-draft-invoice';
import { DraftInvoiceFinishedEvent } from '../../../domain/draft-invoice/events/draft-invoice-finished.event';
import { InvoiceCreatedEvent } from '../../../domain/invoice/events/invoice-created.event';
import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { Invoice } from '../../../domain/invoice/invoice';
import { Id } from '../../../domain/id/id';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient';

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

describe('CompleteDraftInvoice', () => {
    let unitOfWorkFactory: InMemoryUnitOfWorkFactory;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;

    beforeEach(() => {
        unitOfWorkFactory = new InMemoryUnitOfWorkFactory();
        domainEvents = new InMemoryDomainEvents();
        createCommand = new CreateDraftInvoice(unitOfWorkFactory, domainEvents);
        completeCommand = new CompleteDraftInvoice(
            unitOfWorkFactory,
            domainEvents
        );
    });

    it('should throw ITEM_NOT_FOUND when draft invoice does not exist', async () => {
        await expect(
            completeCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
        });
    });

    it('should throw DRAFT_INVOICE_NOT_FULLY_COMPLETE when draft invoice is incomplete', async () => {
        const created = await createCommand.execute({});

        await expect(completeCommand.execute(created.id)).rejects.toMatchObject(
            {
                code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_NOT_FULLY_COMPLETE,
            }
        );
    });

    it('should convert a complete draft into an invoice', async () => {
        const created = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

        const result = await completeCommand.execute(created.id);

        expect(result).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                issueDate: '2025-01-01',
                dueDate: '2025-02-01',
                vatRate: '10',
            })
        );
        expect(result.lineItems.items).toHaveLength(1);
        expect(result.total).toEqual({ amount: '220', currency: 'USD' });
        expect(result.vatAmount).toEqual({ amount: '20', currency: 'USD' });
        expect(result.issuer).not.toBeNull();
        expect(result.recipient).not.toBeNull();
    });

    it('should produce an invoice with a different id than the draft', async () => {
        const created = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

        const result = await completeCommand.execute(created.id);

        expect(result.id).not.toBe(created.id);
    });

    it('should persist the invoice', async () => {
        const created = await createCommand.execute(COMPLETE_DRAFT_REQUEST);

        const result = await completeCommand.execute(created.id);

        await unitOfWorkFactory.start(async (uow) => {
            const loaded = await uow
                .collection(Invoice)
                .get(Id.fromString(result.id));

            expect(loaded).not.toBeNull();
            expect(loaded!.id.toString()).toBe(result.id);
        });
    });

    describe('domain events', () => {
        it('should publish DraftInvoiceFinishedEvent with draft data', async () => {
            const finishedEvents: DraftInvoiceFinishedEvent[] = [];
            domainEvents.subscribeToEvent(DraftInvoiceFinishedEvent, (e) =>
                finishedEvents.push(e)
            );

            const created = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            await completeCommand.execute(created.id);

            expect(finishedEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.finished',
                    data: expect.objectContaining({
                        id: created.id,
                        issueDate: '2025-01-01',
                        dueDate: '2025-02-01',
                        vatRate: '10',
                        total: { amount: '220', currency: 'USD' },
                    }),
                }),
            ]);
        });

        it('should publish InvoiceCreatedEvent with invoice data', async () => {
            const invoiceEvents: InvoiceCreatedEvent[] = [];
            domainEvents.subscribeToEvent(InvoiceCreatedEvent, (e) =>
                invoiceEvents.push(e)
            );

            const created = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(created.id);

            expect(invoiceEvents).toEqual([
                expect.objectContaining({
                    name: 'invoice.created',
                    data: expect.objectContaining({
                        id: invoice.id,
                        issueDate: '2025-01-01',
                        dueDate: '2025-02-01',
                        vatRate: '10',
                        total: { amount: '220', currency: 'USD' },
                    }),
                }),
            ]);
        });

        it('should publish both draft finished and invoice created events', async () => {
            const finishedEvents: DraftInvoiceFinishedEvent[] = [];
            const invoiceEvents: InvoiceCreatedEvent[] = [];
            domainEvents.subscribeToEvent(DraftInvoiceFinishedEvent, (e) =>
                finishedEvents.push(e)
            );
            domainEvents.subscribeToEvent(InvoiceCreatedEvent, (e) =>
                invoiceEvents.push(e)
            );

            const created = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
            const invoice = await completeCommand.execute(created.id);

            expect(finishedEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.finished',
                    data: expect.objectContaining({ id: created.id }),
                }),
            ]);
            expect(invoiceEvents).toEqual([
                expect.objectContaining({
                    name: 'invoice.created',
                    data: expect.objectContaining({ id: invoice.id }),
                }),
            ]);
        });
    });
});
