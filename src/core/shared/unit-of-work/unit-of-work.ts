import { EntityClass, PersistentManager } from './unit-of-work.interface';
import { Collection } from './collection/collection';

export class Session {
    constructor(private readonly persistentManager: PersistentManager) {}

    async begin(): Promise<UnitOfWork> {
        return new UnitOfWork(this.persistentManager.fork());
    }
}

export class UnitOfWork implements AsyncDisposable {
    private readonly collections = new Map<EntityClass, Collection<any>>();
    constructor(private readonly persistentManager: PersistentManager) {}

    collection<T extends { id: { toString(): string } }>(entityClass: {
        prototype: T;
    }): Pick<Collection<T>, 'add' | 'get' | 'findBy'> {
        const existing = this.collections.get(entityClass as EntityClass);

        if (existing) {
            return existing as Collection<T>;
        }

        const collection = new Collection<T>(
            entityClass as EntityClass,
            this.persistentManager
        );

        this.collections.set(entityClass as EntityClass, collection);

        return collection;
    }

    async commit(): Promise<void> {
        await this.persistentManager.commit([...this.collections.entries()]);
    }

    async [Symbol.asyncDispose](): Promise<void> {}
}
