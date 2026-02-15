export interface UnitOfWork {
    collection<T>(entityClass: { prototype: T }): Collection<T>;

    finish(): Promise<void>;
}

export interface UnitOfWorkFactory {
    collection<T>(entityClass: { prototype: T }): Collection<T>;

    start(): Promise<UnitOfWork>;
}

export interface Collection<T> {
    add(id: string, item: T): Promise<void>;
    remove(id: string): Promise<void>;
    get(id: string): Promise<T | undefined>;
}
