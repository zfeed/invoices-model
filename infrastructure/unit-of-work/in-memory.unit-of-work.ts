import {
    Collection,
    UnitOfWork,
    UnitOfWorkFactory,
} from '../../invoices/application/unit-of-work/unit-of-work.interface';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import { EntityClass, mappers, stores } from '../registry';
import { Store } from '../store/store';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    async start(): Promise<UnitOfWork> {
        return new InMemoryUnitOfWork(stores, mappers);
    }
}

class InMemoryUnitOfWork implements UnitOfWork {
    private readonly stores: Map<EntityClass, Store<any>>;
    private readonly identityMaps: Map<EntityClass, Map<string, any>>;
    private readonly markedForDeletion: Map<EntityClass, Set<string>>;
    private readonly mappers: Map<
        EntityClass,
        { toDomain: (plain: any) => any; toPlain: (entity: any) => any }
    >;

    constructor(
        stores: Map<EntityClass, Store<any>>,
        mappers: Map<
            EntityClass,
            { toDomain: (plain: any) => any; toPlain: (entity: any) => any }
        >
    ) {
        this.stores = stores;
        this.identityMaps = new Map();
        this.markedForDeletion = new Map();
        this.mappers = mappers;
    }

    collection<T>(entityClass: EntityClass): Collection<T> {
        const store = this.stores.get(entityClass);

        if (!store) {
            throw new Error(`Store for ${entityClass.name} not found`);
        }

        if (!this.identityMaps.has(entityClass)) {
            this.identityMaps.set(entityClass, new Map());
        }

        if (!this.markedForDeletion.has(entityClass)) {
            this.markedForDeletion.set(entityClass, new Set());
        }

        return new InMemoryCollection(
            entityClass,
            store,
            this.identityMaps.get(entityClass)!,
            this.markedForDeletion.get(entityClass)!,
            this.mappers
        ) as Collection<T>;
    }

    async finish(): Promise<void> {
        for (const [entityClass, identityMap] of this.identityMaps) {
            const store = this.stores.get(entityClass)!;
            const mapper = this.mappers.get(entityClass)!;
            const deletions = this.markedForDeletion.get(entityClass);

            for (const [id, entity] of identityMap) {
                if (deletions?.has(id)) {
                    continue;
                }

                store.set(id, mapper.toPlain(entity));
            }
        }

        for (const [entityClass, ids] of this.markedForDeletion) {
            const store = this.stores.get(entityClass)!;

            for (const id of ids) {
                store.remove(id);
            }
        }
    }
}

class InMemoryCollection {
    constructor(
        private readonly entityClass: EntityClass,
        private readonly store: Store<any>,
        private readonly identityMap: Map<string, any> = new Map(),
        private readonly markedForDeletion: Set<string>,
        private mappers: Map<
            EntityClass,
            { toDomain: (plain: any) => any; toPlain: (entity: any) => any }
        >
    ) {}

    async get(id: string): Promise<any | null> {
        if (this.markedForDeletion.has(id)) {
            return null;
        }

        const item = this.identityMap.get(id);

        if (item) {
            return item;
        }

        const plain = this.store.get(id);

        if (!plain) {
            return null;
        }

        const mapper = this.mappers.get(this.entityClass);

        if (!mapper) {
            throw new Error(`Mapper for ${this.entityClass.name} not found`);
        }

        const entity = mapper.toDomain(plain.value);

        this.identityMap.set(id, entity);

        return entity;
    }

    async add(id: string, object: any): Promise<void> {
        this.identityMap.set(id, object);
    }

    async remove(id: string): Promise<void> {
        this.identityMap.delete(id);
        this.markedForDeletion.add(id);
    }
}
