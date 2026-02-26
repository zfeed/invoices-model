export interface UnitOfWork extends AsyncDisposable {
    collection<T extends { id: { toString(): string } }>(entityClass: {
        prototype: T;
    }): Collection<T>;
}

export interface Session {
    begin(): Promise<UnitOfWork>;
}

export interface Collection<T> {
    add(item: T): Promise<void>;
    get(id: { toString(): string }): Promise<T | undefined>;
    findBy(key: string, value: string): Promise<T | undefined>;
}
