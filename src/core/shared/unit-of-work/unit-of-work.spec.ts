import { DraftInvoice } from '../../invoices/domain/draft-invoice/draft-invoice';
import { Id } from '../../invoices/domain/id/id';
import { LineItem } from '../../invoices/domain/line-item/line-item';
import { InMemoryUnitOfWorkFactory } from '../../../infrastructure/unit-of-work/in-memory.unit-of-work';
import { OptimisticConcurrencyError } from '../optimistic-concurrency.error';
import { Invoice } from '../../invoices/domain/invoice/invoice';
import { CalendarDate } from '../../invoices/domain/calendar-date/calendar-date';
import { Issuer, ISSUER_TYPE } from '../../invoices/domain/issuer/issuer';
import { Recipient, RECIPIENT_TYPE } from '../../invoices/domain/recipient/recipient';
import { Paypal } from '../../invoices/domain/billing/paypal/paypal';
import { UnitDescription } from '../../invoices/domain/line-item/unit-description/unit-description';

describe('UnitOfWork contract (InMemory)', () => {
    describe('Collection.get', () => {
        it('should return null for a non-existing entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection(DraftInvoice);
                const id = Id.fromString('non-existing-id');

                const result = await collection.get(id);

                expect(result).toBeNull();
            });
        });
    });

    describe('Collection.add', () => {
        it('should make entity available via get within the same unit of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection(DraftInvoice);
                const draft = DraftInvoice.create(
                    Id.create().unwrap()
                ).unwrap();

                await collection.add(draft);

                const result = await collection.get(draft.id);

                expect(result?.id.equals(draft.id)).toBe(true);
            });
        });
    });

    describe('finish', () => {
        it('should persist a newly added entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            await factory.start(async (uow) => {
                const result = await uow.collection(DraftInvoice).get(draft.id);

                expect(result).not.toBeNull();
                expect(result?.id.equals(draft.id)).toBe(true);
            });
        });

        it('should persist modifications made to a tracked entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            await factory.start(async (uow) => {
                const loaded = await uow.collection(DraftInvoice).get(draft.id);

                const lineItem = LineItem.create({
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                }).unwrap();
                loaded!.addLineItem(lineItem);
            });

            await factory.start(async (uow) => {
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
            });
        });
    });

    describe('identity map', () => {
        it('should return the same reference when getting the same entity twice', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            await factory.start(async (uow) => {
                const collection = uow.collection(DraftInvoice);

                const first = await collection.get(draft.id);
                const second = await collection.get(draft.id);

                expect(first).toBe(second);
            });
        });

        it('should return the added instance without roundtripping through the store', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection(DraftInvoice);
                const draft = DraftInvoice.create(
                    Id.create().unwrap()
                ).unwrap();

                await collection.add(draft);

                const result = await collection.get(draft.id);
                expect(result).toBe(draft);
            });
        });

        it('should return distinct instances across different units of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            let firstInstance: DraftInvoice | undefined;
            let secondInstance: DraftInvoice | undefined;

            await factory.start(async (uow) => {
                firstInstance = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
            });

            await factory.start(async (uow) => {
                secondInstance = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
            });

            expect(firstInstance).toBeDefined();
            expect(secondInstance).toBeDefined();
            expect(firstInstance).not.toBe(secondInstance);
        });
    });

    describe('isolation', () => {
        it('should not expose uncommitted additions to other units of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow1) => {
                await uow1.collection(DraftInvoice).add(draft);

                await factory.start(async (uow2) => {
                    const result = await uow2
                        .collection(DraftInvoice)
                        .get(draft.id);
                    expect(result).toBeNull();
                });
            });
        });

        it('should not expose uncommitted modifications to other units of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            let lineItemsInOtherUow: unknown = 'not-checked';

            const uow1Promise = factory.start(async (uow1) => {
                const loaded = await uow1
                    .collection(DraftInvoice)
                    .get(draft.id);
                loaded!.addLineItem(
                    LineItem.create({
                        description: 'Consulting',
                        price: { amount: '100', currency: 'USD' },
                        quantity: '2',
                    }).unwrap()
                );

                await factory.start(async (uow2) => {
                    const result = await uow2
                        .collection(DraftInvoice)
                        .get(draft.id);
                    lineItemsInOtherUow = result!.lineItems;
                });
            });

            try {
                await uow1Promise;
            } catch {
                // expected: uow1 may fail with OptimisticConcurrencyError
            }

            expect(lineItemsInOtherUow).toBeNull();
        });
    });

    describe('rollback', () => {
        it('should not persist changes if the callback throws', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await expect(
                factory.start(async (uow) => {
                    await uow.collection(DraftInvoice).add(draft);
                    throw new Error('rollback');
                })
            ).rejects.toThrow('rollback');

            await factory.start(async (uow) => {
                const result = await uow.collection(DraftInvoice).get(draft.id);
                expect(result).toBeNull();
            });
        });

        it('should not persist modifications if the callback throws', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            await expect(
                factory.start(async (uow) => {
                    const loaded = await uow
                        .collection(DraftInvoice)
                        .get(draft.id);
                    loaded!.addLineItem(
                        LineItem.create({
                            description: 'Should not persist',
                            price: { amount: '100', currency: 'USD' },
                            quantity: '1',
                        }).unwrap()
                    );
                    throw new Error('rollback');
                })
            ).rejects.toThrow('rollback');

            await factory.start(async (uow) => {
                const result = await uow.collection(DraftInvoice).get(draft.id);
                expect(result!.lineItems).toBeNull();
            });
        });
    });

    describe('optimistic concurrency', () => {
        it('should throw OptimisticConcurrencyError when two units of work modify the same entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            await expect(
                factory.start(async (uow1) => {
                    const loaded1 = await uow1
                        .collection(DraftInvoice)
                        .get(draft.id);
                    loaded1!.addLineItem(
                        LineItem.create({
                            description: 'From UoW1',
                            price: { amount: '50', currency: 'USD' },
                            quantity: '1',
                        }).unwrap()
                    );

                    // A concurrent UoW commits a change to the same entity first
                    await factory.start(async (uow2) => {
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
                    });

                    // uow1 finishes after uow2 already committed — version mismatch
                })
            ).rejects.toThrow(OptimisticConcurrencyError);
        });
    });

    describe('Collection edge cases', () => {
        it('should throw OptimisticConcurrencyError when adding an entity with an id that already exists in the store', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            await expect(
                factory.start(async (uow) => {
                    await uow.collection(DraftInvoice).add(draft);
                })
            ).rejects.toThrow(OptimisticConcurrencyError);
        });
    });

    describe('dirty tracking', () => {
        it('should cause a concurrency conflict when a read-only load overlaps with a write', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create(Id.create().unwrap()).unwrap();

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
            });

            // A read-only UoW that just loads the entity still bumps the
            // version on commit, so a concurrent writer will conflict.
            await expect(
                factory.start(async (uow1) => {
                    await uow1.collection(DraftInvoice).get(draft.id);

                    // A concurrent UoW modifies and commits the same entity
                    await factory.start(async (uow2) => {
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
                    });

                    // uow1 finishes — version mismatch because uow2 already committed
                })
            ).rejects.toThrow(OptimisticConcurrencyError);
        });
    });

    describe('return value', () => {
        it('should return the value produced by the callback', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            const result = await factory.start(async () => {
                return 42;
            });

            expect(result).toBe(42);
        });

        it('should return undefined when the callback returns nothing', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            const result = await factory.start(async () => {});

            expect(result).toBeUndefined();
        });
    });

    describe('multiple collections', () => {
        it('should persist changes to different entity types independently', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
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

            await factory.start(async (uow) => {
                await uow.collection(DraftInvoice).add(draft);
                await uow.collection(Invoice).add(invoice);
            });

            await factory.start(async (uow) => {
                const loadedDraft = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
                const loadedInvoice = await uow
                    .collection(Invoice)
                    .get(invoice.id);

                expect(loadedDraft).not.toBeNull();
                expect(loadedInvoice).not.toBeNull();
            });
        });

        it('should rollback changes across all collections when the callback throws', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
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

            await expect(
                factory.start(async (uow) => {
                    await uow.collection(DraftInvoice).add(draft);
                    await uow.collection(Invoice).add(invoice);
                    throw new Error('rollback');
                })
            ).rejects.toThrow('rollback');

            await factory.start(async (uow) => {
                const loadedDraft = await uow
                    .collection(DraftInvoice)
                    .get(draft.id);
                const loadedInvoice = await uow
                    .collection(Invoice)
                    .get(invoice.id);

                expect(loadedDraft).toBeNull();
                expect(loadedInvoice).toBeNull();
            });
        });
    });
});
