import { ModificationType } from '../persistent-manager/persistent-manager';

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

    has(key: string): boolean {
        return this.tracked.has(key);
    }

    entries(): IterableIterator<[string, TrackedEntry<T>]> {
        return this.tracked.entries();
    }
}
