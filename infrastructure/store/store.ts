export class Store<T> {
    private readonly data: Map<string, { value: T }> = new Map();

    public set(key: string, value: T) {
        this.data.set(key, {
            value,
        });
    }

    public get(key: string) {
        return this.data.get(key);
    }

    public remove(key: string) {
        this.data.delete(key);
    }
}
