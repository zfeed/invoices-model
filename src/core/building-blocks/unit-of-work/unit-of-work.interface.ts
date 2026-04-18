import type { Collection } from './collection/collection.ts';

export type EntityClass = Function;

export interface PersistentManager<
    T extends { id: { toString(): string } } = { id: { toString(): string } },
> {
    get(entityClass: EntityClass, id: string): Promise<T | null>;
    findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked?: Iterable<T>
    ): Promise<T | null>;
    commit(collections: [EntityClass, Collection<T>][]): Promise<void>;
    rollback(): Promise<void>;
    fork(): Promise<PersistentManager<T>>;
}
