import { Id } from '../../domain/id/id';

export interface UnitOfWork {
    collection<T extends { id: Id }>(entityClass: {
        prototype: T;
    }): Collection<T>;
}

export interface UnitOfWorkFactory {
    start<T>(callback: (uow: UnitOfWork) => Promise<T>): Promise<T>;
}

export interface Collection<T> {
    add(item: T): Promise<void>;
    remove(entity: T): Promise<void>;
    get(id: Id): Promise<T | undefined>;
}
