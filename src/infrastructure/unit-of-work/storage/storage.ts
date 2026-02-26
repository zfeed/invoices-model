import { Store } from '../../store/store';
import { EntityClass, mappers } from '../../registry';

export type StorageRecord = {
    value: any;
    version: number;
};

export type ModificationType = 'created' | 'updated';

export type CommitEntry = {
    id: string;
    data: any;
    modification: ModificationType;
    expectedVersion: number | null;
};

export class Storage {
    private readonly stores = new Map<EntityClass, Store<any>>();

    constructor() {
        for (const entityClass of mappers.keys()) {
            this.stores.set(entityClass, new Store());
        }
    }

    async start(): Promise<void> {
        //
    }

    get(entityClass: EntityClass, id: string): StorageRecord | null {
        const store = this.getStoreOrThrow(entityClass);
        return store.get(id) ?? null;
    }

    findBy(
        entityClass: EntityClass,
        key: string,
        value: string
    ): StorageRecord | null {
        const store = this.getStoreOrThrow(entityClass);

        for (const record of store.values()) {
            if (record.value[key] === value) {
                return record;
            }
        }

        return null;
    }

    finish(entityClass: EntityClass, entries: CommitEntry[]): void {
        const store = this.getStoreOrThrow(entityClass);

        for (const entry of entries) {
            const expectedVersion =
                entry.modification === 'created' ? null : entry.expectedVersion;

            store.setIfVersion(entry.id, entry.data, expectedVersion);
        }
    }

    private getStoreOrThrow(entityClass: EntityClass): Store<any> {
        const store = this.stores.get(entityClass);

        if (!store) {
            throw new Error(`Store for ${entityClass.name} not found`);
        }

        return store;
    }
}
