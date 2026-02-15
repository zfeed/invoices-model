export interface Collection<T> {
    add(id: string, item: T): Promise<void>;
    remove(id: string): Promise<void>;
    get(id: string): Promise<T | undefined>;
}
