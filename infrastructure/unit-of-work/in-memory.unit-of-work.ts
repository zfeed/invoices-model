import {
    Collection,
    UnitOfWork,
    UnitOfWorkFactory,
} from '../../invoices/application/unit-of-work/unit-of-work.interface';
import { EntityClass, stores, mappers } from '../registry';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import { Store } from '../store/store';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    async start(): Promise<UnitOfWork> {
        return new InMemoryUnitOfWork(stores, mappers);
    }
}

class InMemoryUnitOfWork implements UnitOfWork {
    private readonly stores: Map<EntityClass, Store<any>>;
    private readonly identityMap: Map<string, any>;
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
        this.identityMap = new Map();
        this.mappers = mappers;
    }

    collection<T>(entityClass: EntityClass): Collection<T> {
        const store = this.stores.get(entityClass);

        if (!store) {
            throw new Error(`Store for ${entityClass.name} not found`);
        }

        return new InMemoryCollection(
            entityClass,
            store,
            this.identityMap,
            this.mappers
        ) as Collection<T>;
    }

    async finish(): Promise<void> {
        throw new Error('Not implemented');
    }
}

class InMemoryCollection {
    constructor(
        private readonly entityClass: EntityClass,
        private readonly store: Store<any>,
        private readonly identityMap: Map<string, any> = new Map(),
        private mappers: Map<
            EntityClass,
            { toDomain: (plain: any) => any; toPlain: (entity: any) => any }
        >
    ) {}

    async get(id: string): Promise<any | null> {
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
        const mapper = this.mappers.get(this.entityClass);

        if (!mapper) {
            throw new Error(`Mapper for ${this.entityClass.name} not found`);
        }

        const plain = mapper.toPlain(object);

        this.store.set(id, plain);
        this.identityMap.set(id, object);
    }

    async remove(id: string): Promise<void> {
        this.store.remove(id);
        this.identityMap.delete(id);
    }
}
