import { Collection } from '../collections/collection.interface';

export interface UnitOfWork extends Disposable {
    collection<T>(entityClass: { prototype: T }): Collection<T>;
}

export interface UnitOfWorkFactory {
    create(): UnitOfWork;
}
