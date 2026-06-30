import { AsyncLocalStorage } from 'node:async_hooks';

type Store = {
    organizationId: string;
};

export class OrganizationContext {
    readonly #storage = new AsyncLocalStorage<Store>();

    run<T>(store: Store, callback: () => T): T {
        return this.#storage.run(store, callback);
    }

    getOrganizationId(): string {
        const store = this.#storage.getStore();
        if (store === undefined) {
            throw new Error('Organization id is not set in context');
        }
        return store.organizationId;
    }
}

export const organizationContext = new OrganizationContext();
