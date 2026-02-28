import type { Collection } from './collection/collection';

export type EntityClass = Function;

export interface PersistentManager {
    get(entityClass: EntityClass, id: string): Promise<any | null>;
    findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked?: Iterable<any>
    ): Promise<any | null>;
    commit(collections: [EntityClass, Collection<any>][]): Promise<void>;
    rollback(): Promise<void>;
    fork(): PersistentManager;
}
