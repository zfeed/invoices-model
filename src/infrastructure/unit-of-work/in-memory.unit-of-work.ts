import {
    Collection,
    UnitOfWork,
    UnitOfWorkFactory,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import '../mappers/authflow-policy.mapper';
import '../mappers/financial-document.mapper';
import { EntityClass, mappers } from '../registry';
import { OptimisticConcurrencyError } from '../../core/shared/optimistic-concurrency.error';
import { retry } from '../../building-blocks/retry/retry';
import { InMemoryCollection } from './collection/in-memory.collection';
import { Storage } from './storage/storage';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    private readonly storage = new Storage();

    async start<T>(callback: (uow: UnitOfWork) => Promise<T>): Promise<T> {
        const uow = new InMemoryUnitOfWork(this.storage, mappers);

        await uow.start();
        const result = await callback(uow);
        await uow.finish();
        return result;
    }
}

class InMemoryUnitOfWork implements UnitOfWork {
    private static readonly MAX_RETRIES = 5;

    private readonly collections = new Map<
        EntityClass,
        InMemoryCollection<any>
    >();

    constructor(
        private readonly storage: Storage,
        private readonly mappers: Map<
            EntityClass,
            { toDomain: (plain: any) => any; toPlain: (entity: any) => any }
        >
    ) {}

    collection<T extends { id: { toString(): string } }>(
        entityClass: EntityClass
    ): Collection<T> {
        const existing = this.collections.get(entityClass);

        if (existing) {
            return existing as Collection<T>;
        }

        const mapper = this.mappers.get(entityClass);

        if (!mapper) {
            throw new Error(`Mapper for ${entityClass.name} not found`);
        }

        const collection = new InMemoryCollection<T>(
            entityClass,
            this.storage,
            mapper
        );

        this.collections.set(entityClass, collection);

        return collection as Collection<T>;
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
            .times(InMemoryUnitOfWork.MAX_RETRIES);
    }
}
