export interface UnitOfWork {
    collection<T>(entityClass: { prototype: T }): Collection<T>;
}

export interface UnitOfWorkFactory {
    start(callback: (uow: UnitOfWork) => Promise<void>): Promise<void>;
}

export interface Collection<T> {
    add(id: string, item: T): Promise<void>;
    remove(id: string): Promise<void>;
    get(id: string): Promise<T | undefined>;
}
