export type EntityState = 'new' | 'managed';

type TrackedEntry<T> = {
    entity: T;
    state: EntityState;
};

export class IdentityMap<T> {
    private readonly tracked = new Map<string, TrackedEntry<T>>();

    get(key: string): T | undefined {
        return this.tracked.get(key)?.entity;
    }

    set(key: string, entity: T, state: EntityState): void {
        this.tracked.set(key, { entity, state });
    }

    setIfAbsent(key: string, entity: T, state: EntityState): T {
        const existing = this.tracked.get(key);

        if (existing) {
            return existing.entity;
        }

        this.tracked.set(key, { entity, state });
        return entity;
    }

    has(key: string): boolean {
        return this.tracked.has(key);
    }

    entries(): IterableIterator<[string, TrackedEntry<T>]> {
        return this.tracked.entries();
    }
}
