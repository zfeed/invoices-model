import './mappers/draft-invoice.mapper';
import './mappers/invoice.mapper';
import './mappers/authflow-policy.mapper';
import './mappers/financial-document.mapper';

import { Store } from '../store/store';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';
import {
    EntityClass,
    PersistentManager as PersistentManagerInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import type { Collection } from '../../core/shared/unit-of-work/collection/collection';
import { mappers } from './registry';

export class PersistentManager implements PersistentManagerInterface {
    private readonly stores: Map<EntityClass, Store<any>>;
    private readonly versions = new Map<EntityClass, Map<string, number>>();
    private committed = false;
    private rolledBack = false;

    constructor(
        private readonly domainEvents: DomainEvents,
        stores?: Map<EntityClass, Store<any>>
    ) {
        if (stores) {
            this.stores = stores;
        } else {
            this.stores = new Map();
            for (const entityClass of mappers.keys()) {
                this.stores.set(entityClass, new Store());
            }
        }

        for (const entityClass of mappers.keys()) {
            this.versions.set(entityClass, new Map());
        }
    }

    fork(): PersistentManagerInterface {
        return new PersistentManager(this.domainEvents, this.stores);
    }

    get(entityClass: EntityClass, id: string): any | null {
        const store = this.getStoreOrThrow(entityClass);
        const record = store.get(id);

        if (!record) {
            return null;
        }

        this.trackVersion(entityClass, id, record.version);

        return this.getMapper(entityClass).toDomain(record.value);
    }

    findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked: Iterable<any> = []
    ): any | null {
        const mapper = this.getMapper(entityClass);

        for (const entity of tracked) {
            if (mapper.toPlain(entity)[key] === value) {
                return entity;
            }
        }

        const store = this.getStoreOrThrow(entityClass);

        for (const record of store.values()) {
            if (record.value[key] === value) {
                const entity = mapper.toDomain(record.value);
                const id = entity.id.toString();
                this.trackVersion(entityClass, id, record.version);
                return entity;
            }
        }

        return null;
    }

    async rollback(): Promise<void> {
        this.rolledBack = true;
    }

    async commit(collections: [EntityClass, Collection<any>][]): Promise<void> {
        if (this.committed || this.rolledBack) {
            return;
        }

        this.committed = true;

        const allEntities: any[] = [];

        for (const [entityClass, collection] of collections) {
            const store = this.getStoreOrThrow(entityClass);
            const mapper = this.getMapper(entityClass);

            for (const entity of collection.values()) {
                const id = entity.id.toString();
                const data = mapper.toPlain(entity);
                const expectedVersion = this.getTrackedVersion(entityClass, id);

                store.setIfVersion(id, data, expectedVersion);
                allEntities.push(entity);
            }
        }

        await this.domainEvents.publishEvents(...allEntities);
    }

    private trackVersion(
        entityClass: EntityClass,
        id: string,
        version: number
    ): void {
        this.versions.get(entityClass)!.set(id, version);
    }

    private getTrackedVersion(
        entityClass: EntityClass,
        id: string
    ): number | null {
        return this.versions.get(entityClass)?.get(id) ?? null;
    }

    private getMapper(entityClass: EntityClass) {
        const mapper = mappers.get(entityClass);

        if (!mapper) {
            throw new Error(`Mapper for ${entityClass.name} not found`);
        }

        return mapper;
    }

    private getStoreOrThrow(entityClass: EntityClass): Store<any> {
        const store = this.stores.get(entityClass);

        if (!store) {
            throw new Error(`Store for ${entityClass.name} not found`);
        }

        return store;
    }
}
