import { EntityClass, PersistentManager } from './unit-of-work.interface.ts';
import { Collection } from './collection/collection.ts';

export class Session {
    constructor(private readonly persistentManager: PersistentManager) {}

    async begin(): Promise<UnitOfWork> {
        const persistenceManager = await this.persistentManager.fork();
        return new UnitOfWork(persistenceManager);
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

    async [Symbol.asyncDispose](): Promise<void> {
        await this.persistentManager.rollback();
    }
}
