import { Session } from '../../../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../../infrastructure/persistent-manager/pg-persistent-manager';
import { InMemoryDomainEventsBus } from '../../../../../infrastructure/domain-events/in-memory-domain-events-bus';
import { EventOutboxStorage } from '../../../../../infrastructure/event-outbox/event-outbox';
import { kysely } from '../../../../../../database/kysely';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { CompleteDraftInvoice } from '../complete-draft-invoice/complete-draft-invoice';
import { ProcessInvoice } from './process-invoice';
import { InvoiceProcessingEvent } from '../../../domain/invoice/events/invoice-processing.event';
import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes';
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

describe('ProcessInvoice', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;
    let processCommand: ProcessInvoice;

    beforeEach(() => {
        domainEventsBus = new InMemoryDomainEventsBus();
        session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        createCommand = new CreateDraftInvoice(session);
        completeCommand = new CompleteDraftInvoice(session);
        processCommand = new ProcessInvoice(session);
    });

    it('should throw ITEM_NOT_FOUND when invoice does not exist', async () => {
        await expect(
            processCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
        });
    });

    it('should process an issued invoice', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);

        const result = await processCommand.execute(invoice.id);

        expect(result.status).toBe('PROCESSING');
    });

    it('should publish InvoiceProcessingEvent', async () => {
        const processingEvents: InvoiceProcessingEvent[] = [];
        await domainEventsBus.subscribeToEvent(
            InvoiceProcessingEvent,
            async (e) => {
                processingEvents.push(e);
            }
        );

        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);

        await processCommand.execute(invoice.id);

        expect(processingEvents).toEqual([
            expect.objectContaining({
                name: 'invoice.processing',
                data: expect.objectContaining({
                    id: invoice.id,
                    status: 'PROCESSING',
                    lineItems: expect.any(Object),
                    total: { amount: '220', currency: 'USD' },
                    vatRate: '0.1',
                    vatAmount: { amount: '20', currency: 'USD' },
                    issueDate: '2025-01-01',
                    dueDate: '2025-02-01',
                    issuer: {
                        type: 'COMPANY',
                        name: 'Company Inc.',
                        address: '123 Main St',
                        taxId: 'TAX123',
                        email: 'info@company.com',
                    },
                    recipient: {
                        type: 'INDIVIDUAL',
                        name: 'Jane Smith',
                        address: '456 Oak Ave',
                        taxId: 'TAX456',
                        email: 'jane@example.com',
                        taxResidenceCountry: 'US',
                        billing: {
                            type: 'PAYPAL',
                            data: { email: 'jane@paypal.com' },
                        },
                    },
                }),
            }),
        ]);
    });
});
