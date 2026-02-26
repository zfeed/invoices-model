import { Session } from '../../../../../infrastructure/unit-of-work/session';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { UpdateDraftInvoice } from './update-draft-invoice';
import { DraftInvoiceUpdatedEvent } from '../../../domain/draft-invoice/events/draft-invoice-updated.event';
import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient';

describe('UpdateDraftInvoice', () => {
    let session: Session;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let updateCommand: UpdateDraftInvoice;

    beforeEach(() => {
        session = new Session();
        domainEvents = new InMemoryDomainEvents();
        createCommand = new CreateDraftInvoice(session, domainEvents);
        updateCommand = new UpdateDraftInvoice(session, domainEvents);
    });

    it('should throw ITEM_NOT_FOUND when draft invoice does not exist', async () => {
        await expect(
            updateCommand.execute('non-existing-id', {})
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
        });
    });

    it('should update line items on an existing draft', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
            ],
        });

        expect(result.lineItems).not.toBeNull();
        expect(result.lineItems!.items).toHaveLength(1);
        expect(result.lineItems!.items[0]).toEqual(
            expect.objectContaining({
                description: 'Consulting',
                quantity: '2',
            })
        );
        expect(result.total).toEqual({ amount: '200', currency: 'USD' });
    });

    it('should add line items to a draft that had none', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            lineItems: [
                {
                    description: 'New item',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '3',
                },
            ],
        });

        expect(result.lineItems!.items).toHaveLength(1);
        expect(result.lineItems!.items[0]).toEqual(
            expect.objectContaining({
                description: 'New item',
                quantity: '3',
            })
        );
        expect(result.total).toEqual({ amount: '600', currency: 'USD' });
    });

    it('should update vat rate', async () => {
        const created = await createCommand.execute({
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                },
            ],
        });

        const result = await updateCommand.execute(created.id, {
            vatRate: '20',
        });

        expect(result.vatRate).toBe('0.2');
        expect(result.total).toEqual({ amount: '120', currency: 'USD' });
        expect(result.vatAmount).toEqual({ amount: '20', currency: 'USD' });
    });

    it('should update issue date', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            issueDate: '2025-03-15',
        });

        expect(result.issueDate).toBe('2025-03-15');
    });

    it('should update due date', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            dueDate: '2025-04-15',
        });

        expect(result.dueDate).toBe('2025-04-15');
    });

    it('should update issuer', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            issuer: {
                type: ISSUER_TYPE.COMPANY,
                name: 'New Corp',
                address: '999 New St',
                taxId: 'NEWTAX',
                email: 'new@corp.com',
            },
        });

        expect(result.issuer).toEqual({
            type: 'COMPANY',
            name: 'New Corp',
            address: '999 New St',
            taxId: 'NEWTAX',
            email: 'new@corp.com',
        });
    });

    it('should update recipient with paypal billing', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            recipient: {
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'John Doe',
                address: '123 Test St',
                taxId: 'TAXJOHN',
                email: 'john@example.com',
                taxResidenceCountry: 'US',
                billing: {
                    type: 'PAYPAL',
                    email: 'john@paypal.com',
                },
            },
        });

        expect(result.recipient).toEqual(
            expect.objectContaining({
                type: 'INDIVIDUAL',
                name: 'John Doe',
                email: 'john@example.com',
            })
        );
    });

    it('should update multiple fields at once', async () => {
        const created = await createCommand.execute({});

        const result = await updateCommand.execute(created.id, {
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '15',
            issueDate: '2025-01-01',
            dueDate: '2025-02-01',
            issuer: {
                type: ISSUER_TYPE.INDIVIDUAL,
                name: 'John Freelancer',
                address: '123 Home St',
                taxId: 'TAXFREE',
                email: 'john@freelance.com',
            },
            recipient: {
                type: RECIPIENT_TYPE.COMPANY,
                name: 'Client Corp',
                address: '456 Client Ave',
                taxId: 'TAXCLIENT',
                email: 'client@corp.com',
                taxResidenceCountry: 'GB',
                billing: {
                    type: 'PAYPAL',
                    email: 'client@paypal.com',
                },
            },
        });

        expect(result.lineItems!.items).toHaveLength(1);
        expect(result.vatRate).toBe('0.15');
        expect(result.total).toEqual({ amount: '115', currency: 'USD' });
        expect(result.issueDate).toBe('2025-01-01');
        expect(result.dueDate).toBe('2025-02-01');
        expect(result.issuer).not.toBeNull();
        expect(result.recipient).not.toBeNull();
    });

    it('should persist changes across units of work', async () => {
        const created = await createCommand.execute({});

        await updateCommand.execute(created.id, {
            issueDate: '2025-06-01',
        });

        const reloaded = await updateCommand.execute(created.id, {
            dueDate: '2025-07-01',
        });

        expect(reloaded.issueDate).toBe('2025-06-01');
        expect(reloaded.dueDate).toBe('2025-07-01');
    });

    describe('domain events', () => {
        it('should publish DraftInvoiceUpdatedEvent with updated state', async () => {
            const created = await createCommand.execute({});

            const updatedEvents: DraftInvoiceUpdatedEvent[] = [];
            await domainEvents.subscribeToEvent(
                DraftInvoiceUpdatedEvent,
                async (e) => {
                    updatedEvents.push(e);
                }
            );

            await updateCommand.execute(created.id, {
                issueDate: '2025-01-01',
            });

            expect(updatedEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.updated',
                    data: expect.objectContaining({
                        id: created.id,
                        issueDate: '2025-01-01',
                    }),
                }),
            ]);
        });

        it('should publish an event per field update', async () => {
            const created = await createCommand.execute({});

            const updatedEvents: DraftInvoiceUpdatedEvent[] = [];
            await domainEvents.subscribeToEvent(
                DraftInvoiceUpdatedEvent,
                async (e) => {
                    updatedEvents.push(e);
                }
            );

            await updateCommand.execute(created.id, {
                issueDate: '2025-01-01',
                dueDate: '2025-02-01',
            });

            expect(updatedEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.updated',
                    data: expect.objectContaining({
                        id: created.id,
                        issueDate: '2025-01-01',
                        dueDate: null,
                    }),
                }),
                expect.objectContaining({
                    name: 'draft-invoice.updated',
                    data: expect.objectContaining({
                        id: created.id,
                        issueDate: '2025-01-01',
                        dueDate: '2025-02-01',
                    }),
                }),
            ]);
        });
    });
});
