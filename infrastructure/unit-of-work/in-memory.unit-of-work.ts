import { Collection, UnitOfWork, UnitOfWorkFactory } from '../../invoices/application/unit-of-work/unit-of-work.interface';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    collection<T>(_entityClass: { prototype: T }): Collection<T> {
        throw new Error('Not implemented');
    }

    async start(): Promise<UnitOfWork> {
        return new InMemoryUnitOfWork();
    }
}

class InMemoryUnitOfWork implements UnitOfWork {
    collection<T>(_entityClass: { prototype: T }): Collection<T> {
        throw new Error('Not implemented');
    }

    async finish(): Promise<void> {
        throw new Error('Not implemented');
    }
}
