import { Id } from '../../invoices/domain/id/id';
import {
    Collection,
    UnitOfWork,
    UnitOfWorkFactory,
} from '../../invoices/application/unit-of-work/unit-of-work.interface';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import { EntityClass, mappers, stores } from '../registry';
import { OptimisticConcurrencyError, Store } from '../store/store';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    async start<T>(callback: (uow: UnitOfWork) => Promise<T>): Promise<T> {
        const uow = new InMemoryUnitOfWork(stores, mappers);
        const result = await callback(uow);
        await uow.finish();
        return result;
    }
}

class InMemoryUnitOfWork implements UnitOfWork {
    private static readonly MAX_RETRIES = 5;

    private readonly stores: Map<EntityClass, Store<any>>;
    private readonly identityMaps: Map<EntityClass, Map<string, any>>;
    private readonly readVersions: Map<EntityClass, Map<string, number | null>>;
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
        this.readVersions = new Map();
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

        if (!this.readVersions.has(entityClass)) {
            this.readVersions.set(entityClass, new Map());
        }

        if (!this.markedForDeletion.has(entityClass)) {
            this.markedForDeletion.set(entityClass, new Set());
        }

        return new InMemoryCollection(
            entityClass,
            store,
            this.identityMaps.get(entityClass)!,
            this.readVersions.get(entityClass)!,
            this.markedForDeletion.get(entityClass)!,
            this.mappers
        ) as Collection<T>;
    }

    async finish(): Promise<void> {
        for (
            let attempt = 1;
            attempt <= InMemoryUnitOfWork.MAX_RETRIES;
            attempt++
        ) {
            try {
                this.commit();
                return;
            } catch (error) {
                if (
                    error instanceof OptimisticConcurrencyError &&
                    attempt < InMemoryUnitOfWork.MAX_RETRIES
                ) {
                    continue;
                }

                throw error;
            }
        }
    }

    private commit(): void {
        for (const [entityClass, identityMap] of this.identityMaps) {
            const store = this.stores.get(entityClass)!;
            const mapper = this.mappers.get(entityClass)!;
            const versions = this.readVersions.get(entityClass)!;
            const deletions = this.markedForDeletion.get(entityClass);

            for (const [id, entity] of identityMap) {
                if (deletions?.has(id)) {
                    continue;
                }

                const expectedVersion = versions.get(id) ?? null;
                store.setIfVersion(id, mapper.toPlain(entity), expectedVersion);
            }
        }

        for (const [entityClass, ids] of this.markedForDeletion) {
            const store = this.stores.get(entityClass)!;
            const versions = this.readVersions.get(entityClass)!;

            for (const id of ids) {
                const expectedVersion = versions.get(id);

                if (expectedVersion == null) {
                    continue;
                }

                store.removeIfVersion(id, expectedVersion);
            }
        }
    }
}

class InMemoryCollection {
    constructor(
        private readonly entityClass: EntityClass,
        private readonly store: Store<any>,
        private readonly identityMap: Map<string, any> = new Map(),
        private readonly readVersions: Map<string, number | null>,
        private readonly markedForDeletion: Set<string>,
        private mappers: Map<
            EntityClass,
            { toDomain: (plain: any) => any; toPlain: (entity: any) => any }
        >
    ) {}

    async get(id: Id): Promise<any | null> {
        const key = id.toString();

        if (this.markedForDeletion.has(key)) {
            return null;
        }

        const item = this.identityMap.get(key);

        if (item) {
            return item;
        }

        const record = this.store.get(key);

        if (!record) {
            return null;
        }

        const mapper = this.mappers.get(this.entityClass);

        if (!mapper) {
            throw new Error(`Mapper for ${this.entityClass.name} not found`);
        }

        const entity = mapper.toDomain(record.value);

        this.identityMap.set(key, entity);
        this.readVersions.set(key, record.version);

        return entity;
    }

    async add(object: any): Promise<void> {
        const key = object.id.toString();
        this.identityMap.set(key, object);
        this.readVersions.set(key, null);
        this.markedForDeletion.delete(key);
    }

    async remove(entity: { id: Id }): Promise<void> {
        const key = entity.id.toString();
        this.identityMap.delete(key);
        this.markedForDeletion.add(key);
    }
}
