import { EntityClass, PersistentManager } from './unit-of-work.interface';
import { OptimisticConcurrencyError } from '../optimistic-concurrency.error';
import { retry } from '../../../building-blocks/retry/retry';
import { Collection } from './collection/collection';

export class Session {
    private readonly persistentManager: PersistentManager;
    private readonly maxRetries: number;

    constructor(options: {
        persistentManager: PersistentManager;
        maxRetries: number;
    }) {
        this.persistentManager = options.persistentManager;
        this.maxRetries = options.maxRetries;
    }

    async begin(): Promise<UnitOfWork> {
        const uow = new UnitOfWork(this.persistentManager, {
            maxRetries: this.maxRetries,
        });

        return uow;
    }
}

export class UnitOfWork implements AsyncDisposable {
    private readonly collections = new Map<EntityClass, Collection<any>>();
    private readonly maxRetries: number;

    constructor(
        private readonly persistentManager: PersistentManager,
        options: { maxRetries: number }
    ) {
        this.maxRetries = options.maxRetries;
    }

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

    async [Symbol.asyncDispose](): Promise<void> {
        const entries = [...this.collections.values()].flatMap((collection) =>
            collection.commitEntries()
        );

        await retry(() => this.persistentManager.commit(entries))
            .while(OptimisticConcurrencyError)
            .times(this.maxRetries);
    }
}
