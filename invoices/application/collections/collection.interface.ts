export interface Collection<T> {
    add(id: string, item: T): void;
    remove(id: string): void;
    get(id: string): T | undefined;
}
