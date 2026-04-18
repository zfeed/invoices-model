import { Session } from '../../../../building-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { InMemoryDomainEventsBus } from '../../../../../platform/infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../../platform/infrastructure/event-outbox/event-outbox.ts';
import { getTestKysely } from '../../../../../../test/kysely.ts';
const kysely = getTestKysely();
import { CreateDraftInvoice } from './create-draft-invoice.ts';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice.ts';
import { DraftInvoiceCreatedEvent } from '../../../domain/draft-invoice/events/draft-invoice-created.event.ts';
import { DraftInvoiceUpdatedEvent } from '../../../domain/draft-invoice/events/draft-invoice-updated.event.ts';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer.ts';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient.ts';
import { Id } from '../../../domain/id/id.ts';

describe('CreateDraftInvoice', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let command: CreateDraftInvoice;

    beforeEach(() => {
        domainEventsBus = new InMemoryDomainEventsBus();
        session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        command = new CreateDraftInvoice(session);
    });

    it('should create an empty draft invoice', async () => {
        const result = await command.execute({});

        expect(result).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                lineItems: null,
                totalAmount: null,
                totalCurrency: null,
                vatRate: null,
                vatAmount: null,
                vatCurrency: null,
                issueDate: null,
                dueDate: null,
                issuer: null,
                recipient: null,
            })
        );
    });

    it('should persist the draft invoice', async () => {
        const result = await command.execute({});

        {
            await using uow = await session.begin();
            const loaded = await uow
                .collection(DraftInvoice)
                .get(Id.fromString(result.id));

            expect(loaded).not.toBeNull();
            expect(loaded!.id.toString()).toBe(result.id);
        }
    });

    it('should create a draft invoice with line items', async () => {
        const result = await command.execute({
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
            ],
        });

        expect(result.lineItems).not.toBeNull();
        expect(result.lineItems!).toHaveLength(1);
        expect(result.lineItems![0]).toEqual(
            expect.objectContaining({
                description: 'Consulting',
                quantity: '2',
            })
        );
        expect(result.totalAmount).toBe('200');
        expect(result.totalCurrency).toBe('USD');
    });

    it('should create a draft invoice with multiple line items', async () => {
        const result = await command.execute({
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
                {
                    description: 'Development',
                    price: { amount: '150', currency: 'USD' },
                    quantity: '3',
                },
            ],
        });

        expect(result.lineItems!).toHaveLength(2);
        expect(result.totalAmount).toBe('650');
    });

    it('should create a draft invoice with vat rate', async () => {
        const result = await command.execute({
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '20',
        });

        expect(result.vatRate).toBe('0.2');
        expect(result.totalAmount).toBe('120');
        expect(result.vatAmount).toBe('20');
    });

    it('should create a draft invoice with issue date', async () => {
        const result = await command.execute({
            issueDate: '2025-01-01',
        });

        expect(result.issueDate).toBe('2025-01-01');
    });

    it('should create a draft invoice with due date', async () => {
        const result = await command.execute({
            dueDate: '2025-02-01',
        });

        expect(result.dueDate).toBe('2025-02-01');
    });

    it('should create a draft invoice with issuer', async () => {
        const result = await command.execute({
            issuer: {
                type: ISSUER_TYPE.COMPANY,
                name: 'Company Inc.',
                address: '123 Main St',
                taxId: 'TAX123',
                email: 'info@company.com',
            },
        });

        expect(result.issuer).toEqual({
            type: 'COMPANY',
            name: 'Company Inc.',
            address: '123 Main St',
            taxId: 'TAX123',
            email: 'info@company.com',
        });
    });

    it('should create a draft invoice with recipient using paypal billing', async () => {
        const result = await command.execute({
            recipient: {
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'Jane Smith',
                address: '456 Oak Ave',
                taxId: 'TAX456',
                email: 'jane@example.com',
                taxResidenceCountry: 'US',
                billing: {
                    type: 'PAYPAL',
                    email: 'jane@paypal.com',
                },
            },
        });

        expect(result.recipient).toEqual(
            expect.objectContaining({
                type: 'INDIVIDUAL',
                name: 'Jane Smith',
                email: 'jane@example.com',
            })
        );
    });

    it('should create a fully populated draft invoice', async () => {
        const result = await command.execute({
            lineItems: [
                {
                    description: 'Service',
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
                    type: 'PAYPAL',
                    email: 'jane@paypal.com',
                },
            },
        });

        expect(result.lineItems).not.toBeNull();
        expect(result.totalAmount).toBe('220');
        expect(result.vatRate).toBe('0.1');
        expect(result.vatAmount).toBe('20');
        expect(result.issueDate).toBe('2025-01-01');
        expect(result.dueDate).toBe('2025-02-01');
        expect(result.issuer).not.toBeNull();
        expect(result.recipient).not.toBeNull();
    });

    describe('domain events', () => {
        it('should publish DraftInvoiceCreatedEvent for an empty draft', async () => {
            const createdEvents: DraftInvoiceCreatedEvent[] = [];
            await domainEventsBus.subscribeToEvent(
                DraftInvoiceCreatedEvent,
                async (e) => {
                    createdEvents.push(e);
                }
            );

            const result = await command.execute({});

            expect(createdEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.created',
                    data: expect.objectContaining({
                        id: result.id,
                        lineItems: null,
                        total: null,
                    }),
                }),
            ]);
        });

        it('should publish DraftInvoiceCreatedEvent and DraftInvoiceUpdatedEvent when line items are added', async () => {
            const createdEvents: DraftInvoiceCreatedEvent[] = [];
            const updatedEvents: DraftInvoiceUpdatedEvent[] = [];
            await domainEventsBus.subscribeToEvent(
                DraftInvoiceCreatedEvent,
                async (e) => {
                    createdEvents.push(e);
                }
            );
            await domainEventsBus.subscribeToEvent(
                DraftInvoiceUpdatedEvent,
                async (e) => {
                    updatedEvents.push(e);
                }
            );

            const result = await command.execute({
                lineItems: [
                    {
                        description: 'Consulting',
                        price: { amount: '100', currency: 'USD' },
                        quantity: '1',
                    },
                ],
            });

            expect(createdEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.created',
                    data: expect.objectContaining({
                        id: result.id,
                        lineItems: null,
                    }),
                }),
            ]);

            expect(updatedEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.updated',
                    data: expect.objectContaining({
                        id: result.id,
                        total: { amount: '100', currency: 'USD' },
                    }),
                }),
            ]);
        });

        it('should publish a DraftInvoiceUpdatedEvent per line item added', async () => {
            const updatedEvents: DraftInvoiceUpdatedEvent[] = [];
            await domainEventsBus.subscribeToEvent(
                DraftInvoiceUpdatedEvent,
                async (e) => {
                    updatedEvents.push(e);
                }
            );

            const result = await command.execute({
                lineItems: [
                    {
                        description: 'Consulting',
                        price: { amount: '100', currency: 'USD' },
                        quantity: '1',
                    },
                    {
                        description: 'Development',
                        price: { amount: '200', currency: 'USD' },
                        quantity: '1',
                    },
                ],
            });

            expect(updatedEvents).toEqual([
                expect.objectContaining({
                    name: 'draft-invoice.updated',
                    data: expect.objectContaining({
                        id: result.id,
                        total: { amount: '100', currency: 'USD' },
                    }),
                }),
                expect.objectContaining({
                    name: 'draft-invoice.updated',
                    data: expect.objectContaining({
                        id: result.id,
                        total: { amount: '300', currency: 'USD' },
                    }),
                }),
            ]);
        });
    });
});
