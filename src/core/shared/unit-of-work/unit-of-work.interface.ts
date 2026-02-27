import type { Collection } from './collection/collection';

export type EntityClass = Function;

export type ModificationType = 'created' | 'updated';

export interface PersistentManager {
    get(entityClass: EntityClass, id: string): any | null;
    findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked?: Iterable<any>
    ): any | null;
    commit(collections: [EntityClass, Collection<any>][]): Promise<void>;
}
