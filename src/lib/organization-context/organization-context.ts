import { AsyncLocalStorage } from 'node:async_hooks';

type Store = {
    organizationId?: string;
    memberId?: string;
};

export class OrganizationContext {
    readonly #storage = new AsyncLocalStorage<Store>();

    #store(): Store {
        const store = this.#storage.getStore();
        if (store) {
            return store;
        }
        const created: Store = {};
        this.#storage.enterWith(created);
        return created;
    }

    setOrganizationId(organizationId: string): void {
        this.#store().organizationId = organizationId;
    }

    setMemberId(memberId: string): void {
        this.#store().memberId = memberId;
    }

    getOrganizationId(): string {
        const organizationId = this.#storage.getStore()?.organizationId;
        if (organizationId === undefined) {
            throw new Error('Organization id is not set in context');
        }
        return organizationId;
    }

    getMemberId(): string {
        const memberId = this.#storage.getStore()?.memberId;
        if (memberId === undefined) {
            throw new Error('Member id is not set in context');
        }
        return memberId;
    }
}

export const organizationContext = new OrganizationContext();
