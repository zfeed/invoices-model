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
import { IdentityMap } from './identity-map/identity-map';
import { InMemoryCollection } from './collection/in-memory.collection';
import { Storage } from './storage/storage';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    private readonly storage = new Storage(mappers.keys());

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

    private readonly identityMaps = new Map<EntityClass, IdentityMap<any>>();

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
        const mapper = this.mappers.get(entityClass);

        if (!mapper) {
            throw new Error(`Mapper for ${entityClass.name} not found`);
        }

        if (!this.identityMaps.has(entityClass)) {
            this.identityMaps.set(entityClass, new IdentityMap());
        }

        return new InMemoryCollection<T>(
            entityClass,
            this.identityMaps.get(entityClass)!,
            this.storage,
            mapper
        ) as Collection<T>;
    }

    async start(): Promise<void> {
        await this.storage.start();
    }

    async finish(): Promise<void> {
        for (
            let attempt = 1;
            attempt <= InMemoryUnitOfWork.MAX_RETRIES;
            attempt++
        ) {
            try {
                this.commit();
                return;
            } catch (error) {
                if (
                    error instanceof OptimisticConcurrencyError &&
                    attempt < InMemoryUnitOfWork.MAX_RETRIES
                ) {
                    continue;
                }

                throw error;
            }
        }
    }

    private commit(): void {
        for (const [entityClass, identityMap] of this.identityMaps) {
            const mapper = this.mappers.get(entityClass)!;

            const entries = [...identityMap.entries()].map(([id, entry]) => ({
                id,
                data: mapper.toPlain(entry.entity),
                modification: entry.modification,
                expectedVersion: entry.version,
            }));

            this.storage.finish(entityClass, entries);
        }
    }
}
