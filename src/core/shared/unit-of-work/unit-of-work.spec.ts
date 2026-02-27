import { DraftInvoice } from '../../invoices/domain/draft-invoice/draft-invoice';
import { Id } from '../../invoices/domain/id/id';
import { LineItem } from '../../invoices/domain/line-item/line-item';
import { Session } from './unit-of-work';
import { PersistentManager } from '../../../infrastructure/persistent-manager/persistent-manager';
import { InMemoryDomainEvents } from '../../../infrastructure/domain-events/in-memory-domain-events';
import { OptimisticConcurrencyError } from '../optimistic-concurrency.error';
import { Invoice } from '../../invoices/domain/invoice/invoice';
import { CalendarDate } from '../../invoices/domain/calendar-date/calendar-date';
import { Issuer, ISSUER_TYPE } from '../../invoices/domain/issuer/issuer';
import {
    Recipient,
    RECIPIENT_TYPE,
} from '../../invoices/domain/recipient/recipient';
import { Paypal } from '../../invoices/domain/billing/paypal/paypal';
import { UnitDescription } from '../../invoices/domain/line-item/unit-description/unit-description';

describe('UnitOfWork contract (InMemory)', () => {
    describe('Collection.get', () => {
        it('should return null for a non-existing entity', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });

            await using uow = await session.begin();
            const collection = uow.collection(DraftInvoice);
            const id = Id.fromString('non-existing-id');

            const result = await collection.get(id);

            expect(result).toBeNull();
        });
    });

    describe('Collection.add', () => {
        it('should make entity available via get within the same unit of work', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });

            await using uow = await session.begin();
            const collection = uow.collection(DraftInvoice);
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await collection.add(draft);

            const result = await collection.get(draft.id);

            expect(result?.id.equals(draft.id)).toBe(true);
        });
    });

    describe('commit', () => {
        it('should persist a newly added entity', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            {
                await using uow = await session.begin();
                const result = await uow.collection(DraftInvoice).get(draft.id);

                expect(result).not.toBeNull();
                expect(result?.id.equals(draft.id)).toBe(true);
            }
        });

        it('should persist modifications made to a tracked entity', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            {
                await using uow = await session.begin();
                const loaded = await uow.collection(DraftInvoice).get(draft.id);

                const lineItem = LineItem.create({
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                }).unwrap();
                loaded!.addLineItem(lineItem);
            }

            {
                await using uow = await session.begin();
                const result = await uow.collection(DraftInvoice).get(draft.id);

                expect(result!.lineItems).not.toBeNull();
                expect(result!.lineItems!.length).toBe(1);
                expect(
                    result!.lineItems!.find((item: LineItem) =>
                        item.description.equals(
                            UnitDescription.create('Consulting').unwrap()
                        )
                    )
                ).toBeDefined();
            }
        });
    });

    describe('identity map', () => {
        it('should return the same reference when getting the same entity twice', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            {
                await using uow = await session.begin();
                const collection = uow.collection(DraftInvoice);

                const first = await collection.get(draft.id);
                const second = await collection.get(draft.id);

                expect(first).toBe(second);
            }
        });

        it('should return the added instance without roundtripping through the store', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });

            await using uow = await session.begin();
            const collection = uow.collection(DraftInvoice);
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await collection.add(draft);

            const result = await collection.get(draft.id);
            expect(result).toBe(draft);
        });

        it('should return distinct instances across different units of work', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            let firstInstance: DraftInvoice | null;
            let secondInstance: DraftInvoice | null;

            {
                await using uow = await session.begin();
                firstInstance = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
            }

            {
                await using uow = await session.begin();
                secondInstance = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
            }

            expect(firstInstance).toBeDefined();
            expect(secondInstance).toBeDefined();
            expect(firstInstance).not.toBe(secondInstance);
        });
    });

    describe('isolation', () => {
        it('should not expose uncommitted additions to other units of work', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            const uow1 = await session.begin();
            await uow1.collection(DraftInvoice).add(draft);

            {
                await using uow2 = await session.begin();
                const result = await uow2
                    .collection(DraftInvoice)
                    .get(draft.id);
                expect(result).toBeNull();
            }

            await uow1[Symbol.asyncDispose]();
        });

        it('should not expose uncommitted modifications to other units of work', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            let lineItemsInOtherUow: unknown = 'not-checked';

            const uow1 = await session.begin();
            const loaded = await uow1.collection(DraftInvoice).get(draft.id);
            loaded!.addLineItem(
                LineItem.create({
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                }).unwrap()
            );

            {
                await using uow2 = await session.begin();
                const result = await uow2
                    .collection(DraftInvoice)
                    .get(draft.id);
                lineItemsInOtherUow = result!.lineItems;
            }

            try {
                await uow1[Symbol.asyncDispose]();
            } catch {
                // expected: uow1 may fail with OptimisticConcurrencyError
            }

            expect(lineItemsInOtherUow).toBeNull();
        });
    });

    describe('optimistic concurrency', () => {
        it('should throw OptimisticConcurrencyError when two units of work modify the same entity', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            const uow1 = await session.begin();
            const loaded1 = await uow1.collection(DraftInvoice).get(draft.id);
            loaded1!.addLineItem(
                LineItem.create({
                    description: 'From UoW1',
                    price: { amount: '50', currency: 'USD' },
                    quantity: '1',
                }).unwrap()
            );

            // A concurrent UoW commits a change to the same entity first
            {
                await using uow2 = await session.begin();
                const loaded2 = await uow2
                    .collection(DraftInvoice)
                    .get(draft.id);
                loaded2!.addLineItem(
                    LineItem.create({
                        description: 'From UoW2',
                        price: { amount: '75', currency: 'USD' },
                        quantity: '1',
                    }).unwrap()
                );
            }

            // uow1 disposes after uow2 already committed — version mismatch
            await expect(uow1[Symbol.asyncDispose]()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });
    });

    describe('Collection edge cases', () => {
        it('should throw OptimisticConcurrencyError when adding an entity with an id that already exists in the store', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            {
                const uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
                await expect(uow[Symbol.asyncDispose]()).rejects.toThrow(
                    OptimisticConcurrencyError
                );
            }
        });
    });

    describe('dirty tracking', () => {
        it('should cause a concurrency conflict when a read-only load overlaps with a write', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
            }

            // A read-only UoW that just loads the entity still bumps the
            // version on commit, so a concurrent writer will conflict.
            const uow1 = await session.begin();
            await uow1.collection(DraftInvoice).get(draft.id);

            // A concurrent UoW modifies and commits the same entity
            {
                await using uow2 = await session.begin();
                const loaded = await uow2
                    .collection(DraftInvoice)
                    .get(draft.id);
                loaded!.addLineItem(
                    LineItem.create({
                        description: 'Concurrent write',
                        price: { amount: '50', currency: 'USD' },
                        quantity: '1',
                    }).unwrap()
                );
            }

            // uow1 disposes — version mismatch because uow2 already committed
            await expect(uow1[Symbol.asyncDispose]()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });
    });

    describe('multiple collections', () => {
        it('should persist changes to different entity types independently', async () => {
            const session = new Session({
                persistentManager: new PersistentManager(
                    new InMemoryDomainEvents()
                ),
                maxRetries: 5,
            });
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            const lineItem = LineItem.create({
                description: 'Service',
                price: { amount: '200', currency: 'USD' },
                quantity: '1',
            }).unwrap();
            draft.addLineItem(lineItem);
            draft.addIssueDate(CalendarDate.create('2025-01-01').unwrap());
            draft.addDueDate(CalendarDate.create('2025-02-01').unwrap());
            draft.addIssuer(
                Issuer.create({
                    type: ISSUER_TYPE.COMPANY,
                    name: 'Company Inc.',
                    address: '123 Main St',
                    taxId: 'TAX123',
                    email: 'info@company.com',
                }).unwrap()
            );
            draft.addRecipient(
                Recipient.create({
                    type: RECIPIENT_TYPE.INDIVIDUAL,
                    name: 'Jane Smith',
                    address: '456 Oak Ave',
                    taxId: 'TAX456',
                    email: 'jane@example.com',
                    taxResidenceCountry: 'US',
                    billing: Paypal.create({
                        email: 'jane@example.com',
                    }).unwrap(),
                }).unwrap()
            );

            const invoice = draft.toInvoice().unwrap();

            {
                await using uow = await session.begin();
                await uow.collection(DraftInvoice).add(draft);
                await uow.collection(Invoice).add(invoice);
            }

            {
                await using uow = await session.begin();
                const loadedDraft = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
                const loadedInvoice = await uow
                    .collection(Invoice)
                    .get(invoice.id);

                expect(loadedDraft).not.toBeNull();
                expect(loadedInvoice).not.toBeNull();
            }
        });
    });
});
