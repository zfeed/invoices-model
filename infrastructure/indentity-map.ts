import { Store } from './store/store';

interface Mapper<Plain, Domain> {
    toDomain(plain: Plain): Domain;
}

export class IdentityMap<Plain, Domain> {
    private readonly cache: Map<string, Domain> = new Map();

    constructor(
        private readonly store: Store<Plain>,
        private readonly mapper: Mapper<Plain, Domain>
    ) {}

    public get(id: string): Domain | undefined {
        const cached = this.cache.get(id);
        if (cached) {
            return cached;
        }

        const plain = this.store.get(id);
        if (!plain) {
            return undefined;
        }

        const domain = this.mapper.toDomain(plain);
        this.cache.set(id, domain);

        return domain;
    }
}
