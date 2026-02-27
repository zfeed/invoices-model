import './mappers/draft-invoice.mapper';
import './mappers/invoice.mapper';
import './mappers/authflow-policy.mapper';
import './mappers/financial-document.mapper';

import { Store } from '../store/store';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';
import {
    EntityClass,
    CommitEntry,
    PersistentManager as PersistentManagerInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import { mappers } from './registry';

export class PersistentManager implements PersistentManagerInterface {
    private readonly stores = new Map<EntityClass, Store<any>>();
    private readonly versions = new Map<EntityClass, Map<string, number>>();

    constructor(private readonly domainEvents: DomainEvents) {
        for (const entityClass of mappers.keys()) {
            this.stores.set(entityClass, new Store());
            this.versions.set(entityClass, new Map());
        }
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

    async commit(entries: CommitEntry[]): Promise<void> {
        for (const entry of entries) {
            const store = this.getStoreOrThrow(entry.entityClass);
            const mapper = this.getMapper(entry.entityClass);
            const data = mapper.toPlain(entry.entity);

            const expectedVersion =
                entry.modification === 'created'
                    ? null
                    : this.getTrackedVersion(entry.entityClass, entry.id);

            store.setIfVersion(entry.id, data, expectedVersion);
        }

        const entities = entries.map((entry) => entry.entity);

        await this.domainEvents.publishEvents(...entities);
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
