import { OptimisticConcurrencyError } from '../../core/shared/optimistic-concurrency.error';

export { OptimisticConcurrencyError };

export class Store<T> {
    private readonly data: Map<string, { value: T; version: number }> =
        new Map();

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

    public values() {
        return this.data.values();
    }

    public setIfVersion(
        key: string,
        value: T,
        expectedVersion: number | null
    ): number {
        const existing = this.data.get(key);

        if (expectedVersion === null) {
            if (existing) {
                throw new OptimisticConcurrencyError(
                    `Optimistic concurrency conflict on key "${key}"`
                );
            }

            this.data.set(key, { value, version: 1 });
            return 1;
        }

        if (!existing || existing.version !== expectedVersion) {
            throw new OptimisticConcurrencyError(
                `Optimistic concurrency conflict on key "${key}"`
            );
        }

        const newVersion = existing.version + 1;
        this.data.set(key, { value, version: newVersion });
        return newVersion;
    }
}
