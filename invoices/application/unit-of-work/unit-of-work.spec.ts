import { DraftInvoice } from '../../domain/draft-invoice/draft-invoice';
import { LineItem } from '../../domain/line-item/line-item';
import { LineItems } from '../../domain/line-items/line-items';
import { InMemoryUnitOfWorkFactory } from '../../../infrastructure/unit-of-work/in-memory.unit-of-work';
import { OptimisticConcurrencyError } from '../../../infrastructure/store/store';
import { Invoice } from '../../domain/invoice/invoice';
import { CalendarDate } from '../../domain/calendar-date/calendar-date';
import { Issuer, ISSUER_TYPE } from '../../domain/issuer/issuer';
import { Recipient, RECIPIENT_TYPE } from '../../domain/recipient/recipient';
import { Paypal } from '../../domain/recipient/billing/paypal';

describe('UnitOfWork contract (InMemory)', () => {
    describe('Collection.get', () => {
        it('should return null for a non-existing entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);

                const result = await collection.get('non-existing-id');

                expect(result).toBeNull();
            });
        });
    });

    describe('Collection.add', () => {
        it('should make entity available via get within the same unit of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);
                const draft = DraftInvoice.create().unwrap();
                const id = draft.id.toString();

                await collection.add(id, draft);

                const result = await collection.get(id);
                expect(result).toBe(draft);
            });
        });
    });

    describe('Collection.remove', () => {
        it('should make entity unavailable via get within the same unit of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);
                const draft = DraftInvoice.create().unwrap();
                const id = draft.id.toString();

                await collection.add(id, draft);
                await collection.remove(id);

                const result = await collection.get(id);
                expect(result).toBeNull();
            });
        });
    });

    describe('finish', () => {
        it('should persist a newly added entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            await factory.start(async (uow) => {
                const result = await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(id);

                expect(result).not.toBeNull();
                const { id: _resultId, ...resultProps } = result!.toPlain();
                const { id: _draftId, ...draftProps } = draft.toPlain();
                expect(resultProps).toEqual(draftProps);
            });
        });

        it('should persist entity removal', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);
                await collection.get(id);
                await collection.remove(id);
            });

            await factory.start(async (uow) => {
                const result = await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(id);
                expect(result).toBeNull();
            });
        });

        it('should persist modifications made to a tracked entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            await factory.start(async (uow) => {
                const loaded = await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(id);

                const lineItem = LineItem.create({
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                }).unwrap();
                loaded!.addLineItem(lineItem);
            });

            await factory.start(async (uow) => {
                const result = await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(id);

                expect(result!.toPlain().lineItems).not.toBeNull();
                expect(result!.toPlain().lineItems!.items).toHaveLength(1);
                expect(result!.toPlain().lineItems!.items[0].description).toBe(
                    'Consulting'
                );
            });
        });
    });

    describe('identity map', () => {
        it('should return the same reference when getting the same entity twice', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);

                const first = await collection.get(id);
                const second = await collection.get(id);

                expect(first).toBe(second);
            });
        });

        it('should return the added instance without roundtripping through the store', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);
                const draft = DraftInvoice.create().unwrap();
                const id = draft.id.toString();

                await collection.add(id, draft);

                const result = await collection.get(id);
                expect(result).toBe(draft);
            });
        });
    });

    describe('isolation', () => {
        it('should not expose uncommitted additions to other units of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow1) => {
                await uow1
                    .collection<DraftInvoice>(DraftInvoice)
                    .add(id, draft);

                await factory.start(async (uow2) => {
                    const result = await uow2
                        .collection<DraftInvoice>(DraftInvoice)
                        .get(id);
                    expect(result).toBeNull();
                });
            });
        });

        it('should not expose uncommitted removals to other units of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            let visibleInOtherUow: boolean | null = null;

            const uow1Promise = factory.start(async (uow1) => {
                const collection = uow1.collection<DraftInvoice>(DraftInvoice);
                await collection.get(id);
                await collection.remove(id);

                await factory.start(async (uow2) => {
                    const result = await uow2
                        .collection<DraftInvoice>(DraftInvoice)
                        .get(id);
                    visibleInOtherUow = result !== null;
                });
            });

            try {
                await uow1Promise;
            } catch {
                // expected: uow1 may fail with OptimisticConcurrencyError
            }

            expect(visibleInOtherUow).toBe(true);
        });

        it('should not expose uncommitted modifications to other units of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            let lineItemsInOtherUow: unknown = 'not-checked';

            const uow1Promise = factory.start(async (uow1) => {
                const loaded = await uow1
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(id);
                loaded!.addLineItem(
                    LineItem.create({
                        description: 'Consulting',
                        price: { amount: '100', currency: 'USD' },
                        quantity: '2',
                    }).unwrap()
                );

                await factory.start(async (uow2) => {
                    const result = await uow2
                        .collection<DraftInvoice>(DraftInvoice)
                        .get(id);
                    lineItemsInOtherUow = result!.toPlain().lineItems;
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
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await expect(
                factory.start(async (uow) => {
                    await uow
                        .collection<DraftInvoice>(DraftInvoice)
                        .add(id, draft);
                    throw new Error('rollback');
                })
            ).rejects.toThrow('rollback');

            await factory.start(async (uow) => {
                const result = await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(id);
                expect(result).toBeNull();
            });
        });
    });

    describe('optimistic concurrency', () => {
        it('should throw OptimisticConcurrencyError when two units of work modify the same entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            await expect(
                factory.start(async (uow1) => {
                    const loaded1 = await uow1
                        .collection<DraftInvoice>(DraftInvoice)
                        .get(id);
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
                            .collection<DraftInvoice>(DraftInvoice)
                            .get(id);
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
        it('should allow re-adding an entity after removing it in the same unit of work', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);
                const draft = DraftInvoice.create().unwrap();
                const id = draft.id.toString();

                await collection.add(id, draft);
                await collection.remove(id);
                await collection.add(id, draft);

                const result = await collection.get(id);
                expect(result).toBe(draft);
            });
        });

        it('should not throw when removing a non-existing entity', async () => {
            const factory = new InMemoryUnitOfWorkFactory();

            await factory.start(async (uow) => {
                const collection = uow.collection<DraftInvoice>(DraftInvoice);

                await expect(
                    collection.remove('non-existing-id')
                ).resolves.not.toThrow();
            });
        });

        it('should throw OptimisticConcurrencyError when adding an entity with an id that already exists in the store', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const id = draft.id.toString();

            await factory.start(async (uow) => {
                await uow.collection<DraftInvoice>(DraftInvoice).add(id, draft);
            });

            await expect(
                factory.start(async (uow) => {
                    const duplicate = DraftInvoice.create().unwrap();
                    await uow
                        .collection<DraftInvoice>(DraftInvoice)
                        .add(id, duplicate);
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
    });

    describe('multiple collections', () => {
        it('should persist changes to different entity types independently', async () => {
            const factory = new InMemoryUnitOfWorkFactory();
            const draft = DraftInvoice.create().unwrap();
            const draftId = draft.id.toString();

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
            const invoiceId = invoice.id.toString();

            await factory.start(async (uow) => {
                await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .add(draftId, draft);
                await uow.collection<Invoice>(Invoice).add(invoiceId, invoice);
            });

            await factory.start(async (uow) => {
                const loadedDraft = await uow
                    .collection<DraftInvoice>(DraftInvoice)
                    .get(draftId);
                const loadedInvoice = await uow
                    .collection<Invoice>(Invoice)
                    .get(invoiceId);

                expect(loadedDraft).not.toBeNull();
                expect(loadedInvoice).not.toBeNull();
            });
        });
    });
});
