export class OptimisticConcurrencyError extends Error {
    constructor(key: string) {
        super(`Optimistic concurrency conflict on key "${key}"`);
        this.name = 'OptimisticConcurrencyError';
    }
}

export class Store<T> {
    private readonly data: Map<string, { value: T; version: number }> = new Map();

    public set(key: string, value: T) {
        const existing = this.data.get(key);
        this.data.set(key, {
            value,
            version: existing ? existing.version + 1 : 1,
        });
    }

    public get(key: string) {
        return this.data.get(key);
    }

    public remove(key: string) {
        this.data.delete(key);
    }

    public setIfVersion(key: string, value: T, expectedVersion: number | null): number {
        const existing = this.data.get(key);

        if (expectedVersion === null) {
            if (existing) {
                throw new OptimisticConcurrencyError(key);
            }

            this.data.set(key, { value, version: 1 });
            return 1;
        }

        if (!existing || existing.version !== expectedVersion) {
            throw new OptimisticConcurrencyError(key);
        }

        const newVersion = existing.version + 1;
        this.data.set(key, { value, version: newVersion });
        return newVersion;
    }

    public removeIfVersion(key: string, expectedVersion: number) {
        const existing = this.data.get(key);

        if (!existing || existing.version !== expectedVersion) {
            throw new OptimisticConcurrencyError(key);
        }

        this.data.delete(key);
    }
}
