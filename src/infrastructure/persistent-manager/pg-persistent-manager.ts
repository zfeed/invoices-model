import { DraftInvoice } from '../../core/invoices/domain/draft-invoice/draft-invoice';
import { Invoice } from '../../core/invoices/domain/invoice/invoice';
import { AuthflowPolicy } from '../../core/financial-authorization/domain/authflow/authflow-policy';
import { FinancialDocument } from '../../core/financial-authorization/domain/document/document';
import { Store } from '../store/store';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';
import {
    EntityClass,
    PersistentManager as PersistentManagerInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import type { Collection } from '../../core/shared/unit-of-work/collection/collection';

type Entity = DraftInvoice | Invoice | AuthflowPolicy | FinancialDocument;

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private committed = false;
    private rolledBack = false;

    constructor(private readonly domainEvents: DomainEvents) {}

    async fork(): Promise<PersistentManagerInterface<Entity>> {
        return new PersistentManager(this.domainEvents);
    }

    async get(entityClass: EntityClass, id: string): Promise<Entity | null> {
        throw new Error('Unimplemented');
    }

    async findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked: Iterable<Entity> = []
    ): Promise<Entity | null> {
        throw new Error('Unimplemented');
    }

    async rollback(): Promise<void> {
        this.rolledBack = true;
    }

    async commit(
        collections: [EntityClass, Collection<Entity>][]
    ): Promise<void> {
        throw new Error('Unimplemented');
    }
}
