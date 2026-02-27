import { Session } from '../../../../../infrastructure/unit-of-work/session';
import { Storage } from '../../../../../infrastructure/unit-of-work/storage/storage';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { CompleteDraftInvoice } from '../complete-draft-invoice/complete-draft-invoice';
import { CancelInvoice } from './cancel-invoice';
import { InvoiceCancelledEvent } from '../../../domain/invoice/events/invoice-cancelled.event';
import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
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

describe('CancelInvoice', () => {
    let session: Session;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;
    let cancelCommand: CancelInvoice;

    beforeEach(() => {
        domainEvents = new InMemoryDomainEvents();
        session = new Session({
            storage: new Storage(domainEvents),
            maxRetries: 5,
        });
        createCommand = new CreateDraftInvoice(session);
        completeCommand = new CompleteDraftInvoice(session);
        cancelCommand = new CancelInvoice(session);
    });

    it('should throw ITEM_NOT_FOUND when invoice does not exist', async () => {
        await expect(
            cancelCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
        });
    });

    it('should cancel an issued invoice', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);

        const result = await cancelCommand.execute(invoice.id);

        expect(result.status).toBe('CANCELLED');
    });

    it('should publish InvoiceCancelledEvent', async () => {
        const cancelledEvents: InvoiceCancelledEvent[] = [];
        await domainEvents.subscribeToEvent(
            InvoiceCancelledEvent,
            async (e) => {
                cancelledEvents.push(e);
            }
        );

        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);

        await cancelCommand.execute(invoice.id);

        expect(cancelledEvents).toEqual([
            expect.objectContaining({
                name: 'invoice.cancelled',
                data: expect.objectContaining({
                    id: invoice.id,
                    status: 'CANCELLED',
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
