import {
    Collection as CollectionInterface,
    UnitOfWork as UnitOfWorkInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import { EntityClass } from '../registry';
import { OptimisticConcurrencyError } from '../../core/shared/optimistic-concurrency.error';
import { retry } from '../../building-blocks/retry/retry';
import { Collection } from './collection/collection';
import { Storage } from './storage/storage';

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

    async start(): Promise<void> {
        await this.storage.start();
    }

    async finish(): Promise<void> {
        const entries = [...this.collections.values()].flatMap((collection) =>
            collection.commitEntries()
        );

        await retry(() => this.storage.finish(entries))
            .while(OptimisticConcurrencyError)
            .times(this.maxRetries);
    }
}
