import { Collection } from '../collections/collection.interface';
import { UnitOfWork, UnitOfWorkFactory } from './unit-of-work.interface';

export class InMemoryUnitOfWork implements UnitOfWork {
    #collections = new Map<{ prototype: unknown }, Collection<unknown>>();

    register<T>(
        entityClass: { prototype: T },
        collection: Collection<T>
    ): this {
        this.#collections.set(entityClass, collection as Collection<unknown>);
        return this;
    }

    collection<T>(entityClass: { prototype: T }): Collection<T> {
        const collection = this.#collections.get(entityClass);

        if (!collection) {
            throw new Error(
                `Collection not registered for the given entity class`
            );
        }

        return collection as Collection<T>;
    }

    [Symbol.dispose](): void {
        // No-op for in-memory implementation.
        // Database-backed implementations would commit the transaction here.
    }
}

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    #unitOfWork: InMemoryUnitOfWork;

    constructor(unitOfWork: InMemoryUnitOfWork) {
        this.#unitOfWork = unitOfWork;
    }

    create(): UnitOfWork {
        return this.#unitOfWork;
    }
}
