import {
    Collection as CollectionInterface,
    UnitOfWork as UnitOfWorkInterface,
    Session as SessionInterface,
    EntityClass,
    Storage,
} from './unit-of-work.interface';
import { OptimisticConcurrencyError } from '../optimistic-concurrency.error';
import { retry } from '../../../building-blocks/retry/retry';
import { Collection } from './collection/collection';

export class Session implements SessionInterface {
    private readonly storage: Storage;
    private readonly maxRetries: number;

    constructor(options: { storage: Storage; maxRetries: number }) {
        this.storage = options.storage;
        this.maxRetries = options.maxRetries;
    }

    async begin(): Promise<UnitOfWorkInterface> {
        const uow = new UnitOfWork(this.storage, {
            maxRetries: this.maxRetries,
        });

        return uow;
    }
}

export class UnitOfWork implements UnitOfWorkInterface {
    private readonly collections = new Map<EntityClass, Collection<any>>();
    private readonly maxRetries: number;

    constructor(
        private readonly storage: Storage,
        options: { maxRetries: number }
    ) {
        this.maxRetries = options.maxRetries;
    }

    collection<T extends { id: { toString(): string } }>(
        entityClass: EntityClass
    ): CollectionInterface<T> {
        const existing = this.collections.get(entityClass);

        if (existing) {
            return existing as CollectionInterface<T>;
        }

        const collection = new Collection<T>(entityClass, this.storage);

        this.collections.set(entityClass, collection);

        return collection as CollectionInterface<T>;
    }

    async [Symbol.asyncDispose](): Promise<void> {
        const entries = [...this.collections.values()].flatMap((collection) =>
            collection.commitEntries()
        );

        await retry(() => this.storage.commit(entries))
            .while(OptimisticConcurrencyError)
            .times(this.maxRetries);
    }
}
