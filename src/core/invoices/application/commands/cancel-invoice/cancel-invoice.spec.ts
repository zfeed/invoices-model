import { Session } from '../../../../bulding-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { InMemoryDomainEventsBus } from '../../../../../platform/infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../../platform/infrastructure/event-outbox/event-outbox.ts';
import { getTestKysely } from '../../../../../../test/kysely.ts';
const kysely = getTestKysely();
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice.ts';
import { CompleteDraftInvoice } from '../complete-draft-invoice/complete-draft-invoice.ts';
import { CancelInvoice } from './cancel-invoice.ts';
import { InvoiceCancelledEvent } from '../../../domain/invoice/events/invoice-cancelled.event.ts';
import { KNOWN_ERROR_CODE } from '../../../../bulding-blocks/errors/known-error-codes.ts';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer.ts';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient.ts';

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
    let domainEventsBus: InMemoryDomainEventsBus;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;
    let cancelCommand: CancelInvoice;

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
        cancelCommand = new CancelInvoice(session);
    });

    it('should throw ITEM_NOT_FOUND when invoice does not exist', async () => {
        await expect(
            cancelCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
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
        await domainEventsBus.subscribeToEvent(
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
