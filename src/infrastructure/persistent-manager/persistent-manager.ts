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
import {
    DraftInvoiceDataMapper,
    DraftInvoiceRecord,
} from './mappers/invoices/draft-invoice.data-mapper';
import {
    InvoiceDataMapper,
    InvoiceRecord,
} from './mappers/invoices/invoice.data-mapper';
import {
    AuthflowPolicyDataMapper,
    AuthflowPolicyRecord,
} from './mappers/financial-authorization/authflow-policy.data-mapper';
import {
    FinancialDocumentDataMapper,
    FinancialDocumentRecord,
} from './mappers/financial-authorization/financial-document.data-mapper';

type Entity = DraftInvoice | Invoice | AuthflowPolicy | FinancialDocument;

const entityClasses: EntityClass[] = [
    DraftInvoice,
    Invoice,
    AuthflowPolicy,
    FinancialDocument,
];

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private readonly versions = new Map<EntityClass, Map<string, number>>();
    private committed = false;
    private rolledBack = false;

    constructor(
        private readonly domainEvents: DomainEvents,
        private readonly stores: Map<
            EntityClass,
            Store<Record<string, unknown>>
        > = new Map(entityClasses.map((ec) => [ec, new Store()]))
    ) {
        for (const entityClass of entityClasses) {
            this.versions.set(entityClass, new Map());
        }
    }

    async fork(): Promise<PersistentManagerInterface<Entity>> {
        return new PersistentManager(this.domainEvents, this.stores);
    }

    async get(entityClass: EntityClass, id: string) {
        const store = this.getStoreOrThrow(entityClass);
        const record = store.get(id);

        if (!record) {
            return null;
        }

        this.trackVersion(entityClass, id, record.version);

        return this.fromRecord(entityClass, record.value);
    }

    async findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked: Iterable<Entity> = []
    ) {
        for (const entity of tracked) {
            const record = this.toRecord(entity);

            if (this.resolveRecordValue(record[key]) === value) {
                return entity;
            }
        }

        const store = this.getStoreOrThrow(entityClass);

        for (const record of store.values()) {
            if (this.resolveRecordValue(record.value[key]) === value) {
                const entity = this.fromRecord(entityClass, record.value);
                const id = entity.id.toString();
                this.trackVersion(entityClass, id, record.version);
                return entity;
            }
        }

        return null;
    }

    async rollback(): Promise<void> {
        this.rolledBack = true;
    }

    async commit(
        collections: [EntityClass, Collection<Entity>][]
    ): Promise<void> {
        if (this.committed || this.rolledBack) {
            return;
        }

        this.committed = true;

        const allEntities: Entity[] = [];

        for (const [entityClass, collection] of collections) {
            const store = this.getStoreOrThrow(entityClass);

            for (const entity of collection.values()) {
                const id = entity.id.toString();
                const data = this.toRecord(entity);
                const expectedVersion = this.getTrackedVersion(entityClass, id);

                store.setIfVersion(id, data, expectedVersion);
                allEntities.push(entity);
            }
        }

        await this.domainEvents.publishEvents(...allEntities);
    }

    private fromRecord(
        entityClass: EntityClass,
        record: Record<string, unknown>
    ): Entity {
        if (entityClass === DraftInvoice) {
            return DraftInvoiceDataMapper.fromRecord(
                record as DraftInvoiceRecord
            );
        }

        if (entityClass === Invoice) {
            return InvoiceDataMapper.fromRecord(record as InvoiceRecord);
        }

        if (entityClass === AuthflowPolicy) {
            return AuthflowPolicyDataMapper.fromRecord(
                record as AuthflowPolicyRecord
            );
        }

        if (entityClass === FinancialDocument) {
            return FinancialDocumentDataMapper.fromRecord(
                record as FinancialDocumentRecord
            );
        }

        throw new Error(`No mapper for ${entityClass.name}`);
    }

    private toRecord(entity: Entity): Record<string, unknown> {
        if (entity instanceof DraftInvoice) {
            return DraftInvoiceDataMapper.from(entity).toRecord();
        }

        if (entity instanceof Invoice) {
            return InvoiceDataMapper.from(entity).toRecord();
        }

        if (entity instanceof AuthflowPolicy) {
            return AuthflowPolicyDataMapper.from(entity).toRecord();
        }

        if (entity instanceof FinancialDocument) {
            return FinancialDocumentDataMapper.from(entity).toRecord();
        }

        throw new Error('No mapper for entity');
    }

    private resolveRecordValue(value: unknown): unknown {
        if (value !== null && typeof value === 'object' && 'value' in value) {
            return (value as Record<string, unknown>).value;
        }

        return value;
    }

    private trackVersion(
        entityClass: EntityClass,
        id: string,
        version: number
    ): void {
        this.versions.get(entityClass)!.set(id, version);
    }

    private getTrackedVersion(
        entityClass: EntityClass,
        id: string
    ): number | null {
        return this.versions.get(entityClass)?.get(id) ?? null;
    }

    private getStoreOrThrow(
        entityClass: EntityClass
    ): Store<Record<string, unknown>> {
        const store = this.stores.get(entityClass);

        if (!store) {
            throw new Error(`Store for ${entityClass.name} not found`);
        }

        return store;
    }
}
