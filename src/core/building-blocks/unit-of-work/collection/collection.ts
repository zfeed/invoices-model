import { EntityClass, PersistentManager } from '../unit-of-work.interface.ts';
import { EntityState, IdentityMap } from '../identity-map/identity-map.ts';

export type TrackedEntity<T> = {
    entity: T;
    state: EntityState;
};

export class Collection<T extends { id: { toString(): string } }> {
    private readonly identityMap = new IdentityMap<T>();

    constructor(
        private readonly entityClass: EntityClass,
        private readonly persistentManager: PersistentManager
    ) {}

    async get(id: { toString(): string }): Promise<T | null> {
        const key = id.toString();

        const item = this.identityMap.get(key);

        if (item) {
            return item;
        }

        const entity = (await this.persistentManager.get(
            this.entityClass,
            key
        )) as T | null;

        if (!entity) {
            return null;
        }

        return this.identityMap.setIfAbsent(key, entity, 'managed');
    }

    async findBy(key: string, value: string): Promise<T | undefined> {
        const entity = (await this.persistentManager.findBy(
            this.entityClass,
            key,
            value,
            this.trackedEntities()
        )) as T | null;

        if (!entity) {
            return undefined;
        }

        const entityKey = entity.id.toString();

        return this.identityMap.setIfAbsent(entityKey, entity, 'managed');
    }

    async add(object: T): Promise<void> {
        const key = object.id.toString();
        this.identityMap.setIfAbsent(key, object, 'new');
    }

    values(): T[] {
        return this.trackedEntities();
    }

    entries(): TrackedEntity<T>[] {
        return [...this.identityMap.entries()].map(([, entry]) => ({
            entity: entry.entity,
            state: entry.state,
        }));
    }

    private trackedEntities(): T[] {
        return [...this.identityMap.entries()].map(([, entry]) => entry.entity);
    }
}
