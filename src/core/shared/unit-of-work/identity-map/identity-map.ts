import { ModificationType } from '../unit-of-work.interface';

type TrackedEntry<T> = {
    entity: T;
    modification: ModificationType;
};

export class IdentityMap<T> {
    private readonly tracked = new Map<string, TrackedEntry<T>>();

    get(key: string): T | undefined {
        return this.tracked.get(key)?.entity;
    }

    set(key: string, entity: T, modification: ModificationType): void {
        this.tracked.set(key, { entity, modification });
    }

    setIfAbsent(key: string, entity: T, modification: ModificationType): T {
        const existing = this.tracked.get(key);

        if (existing) {
            return existing.entity;
        }

        this.tracked.set(key, { entity, modification });
        return entity;
    }

    has(key: string): boolean {
        return this.tracked.has(key);
    }

    entries(): IterableIterator<[string, TrackedEntry<T>]> {
        return this.tracked.entries();
    }
}
