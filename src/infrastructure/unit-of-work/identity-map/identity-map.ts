import { ModificationType } from '../storage/storage';

type TrackedEntry<T> = {
    entity: T;
    version: number | null;
    modification: ModificationType;
};

export class IdentityMap<T> {
    private readonly tracked = new Map<string, TrackedEntry<T>>();

    get(key: string): T | undefined {
        return this.tracked.get(key)?.entity;
    }

    set(
        key: string,
        entity: T,
        version: number | null,
        modification: ModificationType
    ): void {
        this.tracked.set(key, { entity, version, modification });
    }

    has(key: string): boolean {
        return this.tracked.has(key);
    }

    getVersion(key: string): number | null {
        return this.tracked.get(key)?.version ?? null;
    }

    getModification(key: string): ModificationType {
        return this.tracked.get(key)!.modification;
    }

    entries(): IterableIterator<[string, TrackedEntry<T>]> {
        return this.tracked.entries();
    }
}
