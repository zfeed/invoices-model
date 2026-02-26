import { EntityClass } from '../../registry';
import { IdentityMap } from '../identity-map/identity-map';
import { CommitEntry, Storage } from '../storage/storage';

export class Collection<T extends { id: { toString(): string } }> {
    private readonly identityMap = new IdentityMap<T>();

    constructor(
        private readonly entityClass: EntityClass,
        private readonly storage: Storage
    ) {}

    async get(id: { toString(): string }): Promise<T | null> {
        const key = id.toString();

        const item = this.identityMap.get(key);

        if (item) {
            return item;
        }

        const entity = this.storage.get(this.entityClass, key) as T | null;

        if (!entity) {
            return null;
        }

        this.identityMap.set(key, entity, 'updated');

        return entity;
    }

    async findBy(key: string, value: string): Promise<T | undefined> {
        const entity = this.storage.findBy(
            this.entityClass,
            key,
            value,
            this.trackedEntities()
        ) as T | null;

        if (!entity) {
            return undefined;
        }

        const entityKey = entity.id.toString();

        if (!this.identityMap.has(entityKey)) {
            this.identityMap.set(entityKey, entity, 'updated');
        }

        return entity;
    }

    async add(object: T): Promise<void> {
        const key = object.id.toString();
        this.identityMap.set(key, object, 'created');
    }

    commitEntries(): CommitEntry[] {
        return [...this.identityMap.entries()].map(([id, entry]) => ({
            entityClass: this.entityClass,
            id,
            entity: entry.entity,
            modification: entry.modification,
        }));
    }

    private trackedEntities(): T[] {
        return [...this.identityMap.entries()].map(([, entry]) => entry.entity);
    }
}
