export interface UnitOfWork {
    collection<T extends { id: { toString(): string } }>(entityClass: {
        prototype: T;
    }): Collection<T>;
}

export interface Session {
    start<T>(callback: (uow: UnitOfWork) => Promise<T>): Promise<T>;
}

export interface Collection<T> {
    add(item: T): Promise<void>;
    get(id: { toString(): string }): Promise<T | undefined>;
    findBy(key: string, value: string): Promise<T | undefined>;
}
