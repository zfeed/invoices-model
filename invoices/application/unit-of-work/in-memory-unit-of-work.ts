import { Collection } from './collection.interface';
import { UnitOfWork, UnitOfWorkFactory } from './unit-of-work.interface';

export class InMemoryUnitOfWork implements UnitOfWork {
    collection<T>(entityClass: { prototype: T }): Collection<T> {
        throw new Error('Not implemented');
    }

    [Symbol.dispose](): void {}
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
