import { DraftInvoice } from '../../domain/draft-invoice/draft-invoice';
import { LineItem } from '../../domain/line-item/line-item';
import { InMemoryUnitOfWorkFactory } from '../../../infrastructure/unit-of-work/in-memory.unit-of-work';

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
                const result = await uow.collection<DraftInvoice>(DraftInvoice).get(id);

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
                const result = await uow.collection<DraftInvoice>(DraftInvoice).get(id);
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
                const loaded = await uow.collection<DraftInvoice>(DraftInvoice).get(id);

                const lineItem = LineItem.create({
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                }).unwrap();
                loaded!.addLineItem(lineItem);
            });

            await factory.start(async (uow) => {
                const result = await uow.collection<DraftInvoice>(DraftInvoice).get(id);

                expect(result!.toPlain().lineItems).not.toBeNull();
                expect(result!.toPlain().lineItems!.items).toHaveLength(1);
                expect(result!.toPlain().lineItems!.items[0].description).toBe('Consulting');
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
                await uow1.collection<DraftInvoice>(DraftInvoice).add(id, draft);

                await factory.start(async (uow2) => {
                    const result = await uow2.collection<DraftInvoice>(DraftInvoice).get(id);
                    expect(result).toBeNull();
                });
            });
        });
    });
});
