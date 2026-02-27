export type EntityClass = Function;

export type ModificationType = 'created' | 'updated';

export type CommitEntry = {
    entityClass: EntityClass;
    id: string;
    entity: any;
    modification: ModificationType;
};

export interface Storage {
    get(entityClass: EntityClass, id: string): any | null;
    findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked?: Iterable<any>
    ): any | null;
    commit(entries: CommitEntry[]): Promise<void>;
}

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
