import { EntityClass } from '../../registry';
import { IdentityMap } from '../identity-map/identity-map';
import { CommitEntry, Storage } from '../storage/storage';

type Mapper = {
    toDomain: (plain: any) => any;
    toPlain: (entity: any) => any;
};

export class Collection<T extends { id: { toString(): string } }> {
    private readonly identityMap = new IdentityMap<T>();

    constructor(
        private readonly entityClass: EntityClass,
        private readonly storage: Storage,
        private readonly mapper: Mapper
    ) {}

    async get(id: { toString(): string }): Promise<T | null> {
        const key = id.toString();

        const item = this.identityMap.get(key);

        if (item) {
            return item;
        }

        const record = this.storage.get(this.entityClass, key);

        if (!record) {
            return null;
        }

        const entity = this.mapper.toDomain(record.value);

        this.identityMap.set(key, entity, record.version, 'updated');

        return entity;
    }

    async findBy(key: string, value: string): Promise<T | undefined> {
        for (const [, entry] of this.identityMap.entries()) {
            const plain = this.mapper.toPlain(entry.entity);
            if (plain[key] === value) {
                return entry.entity;
            }
        }

        const record = this.storage.findBy(this.entityClass, key, value);

        if (!record) {
            return undefined;
        }

        const entity = this.mapper.toDomain(record.value);
        const entityKey = entity.id.toString();
        this.identityMap.set(entityKey, entity, record.version, 'updated');

        return entity;
    }

    async add(object: T): Promise<void> {
        const key = object.id.toString();
        this.identityMap.set(key, object, null, 'created');
    }

    commitEntries(): CommitEntry[] {
        return [...this.identityMap.entries()].map(([id, entry]) => ({
            entityClass: this.entityClass,
            id,
            data: this.mapper.toPlain(entry.entity),
            modification: entry.modification,
            expectedVersion: entry.version,
        }));
    }
}
