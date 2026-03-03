import { DraftInvoice } from '../../core/invoices/domain/draft-invoice/draft-invoice';
import { Invoice } from '../../core/invoices/domain/invoice/invoice';
import { AuthflowPolicy } from '../../core/financial-authorization/domain/authflow/authflow-policy';
import { FinancialDocument } from '../../core/financial-authorization/domain/document/document';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';
import {
    EntityClass,
    PersistentManager as PersistentManagerInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import type { Collection } from '../../core/shared/unit-of-work/collection/collection';
import { kysely, ControlledTransaction } from '../../../database/kysely';
import { Store } from '../store/store';
import { DraftInvoiceStorage } from './draft-invoice-storage';
import { InvoiceStorage } from './invoice-storage';
import { DraftInvoiceDataMapper } from './mappers/invoices/draft-invoice.data-mapper';
import { InvoiceDataMapper } from './mappers/invoices/invoice.data-mapper';
import {
    AuthflowPolicyDataMapper,
    AuthflowPolicyRecord,
} from './mappers/financial-authorization/authflow-policy.data-mapper';
import {
    FinancialDocumentDataMapper,
    FinancialDocumentRecord,
} from './mappers/financial-authorization/financial-document.data-mapper';
type Entity = DraftInvoice | Invoice | AuthflowPolicy | FinancialDocument;

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inMemoryEntityClasses: EntityClass[] = [
    AuthflowPolicy,
    FinancialDocument,
];

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private committed = false;
    private rolledBack = false;
    private transaction: ControlledTransaction | null = null;
    private readonly versions = new Map<EntityClass, Map<string, number>>();

    constructor(
        private readonly domainEvents: DomainEvents,
        private readonly stores: Map<
            EntityClass,
            Store<Record<string, unknown>>
        > = new Map(inMemoryEntityClasses.map((ec) => [ec, new Store()]))
    ) {
        for (const entityClass of inMemoryEntityClasses) {
            this.versions.set(entityClass, new Map());
        }
    }

    async fork(): Promise<PersistentManagerInterface<Entity>> {
        const newManager = new PersistentManager(
            this.domainEvents,
            this.stores
        );
        await newManager.initTransaction();

        return newManager;
    }

    async get(entityClass: EntityClass, id: string): Promise<Entity | null> {
        if (
            entityClass === AuthflowPolicy ||
            entityClass === FinancialDocument
        ) {
            return this.getFromStore(entityClass, id);
        }

        if (!UUID_RE.test(id)) {
            return null;
        }

        const tx = this.getTransaction();

        if (entityClass === DraftInvoice) {
            const storage = new DraftInvoiceStorage(tx);
            const rows = await storage.select(id);

            if (rows.length === 0) {
                return null;
            }

            return DraftInvoiceDataMapper.fromRows(rows);
        }

        if (entityClass === Invoice) {
            const storage = new InvoiceStorage(tx);
            const rows = await storage.select(id);

            if (rows.length === 0) {
                return null;
            }

            return InvoiceDataMapper.fromRows(rows);
        }

        throw new Error(`Unknown entity class: ${entityClass.name}`);
    }

    async findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked: Iterable<Entity> = []
    ): Promise<Entity | null> {
        for (const entity of tracked) {
            const record = this.toRecord(entity);

            if (this.resolveRecordValue(record[key]) === value) {
                return entity;
            }
        }

        const store = this.stores.get(entityClass);

        if (!store) {
            return null;
        }

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
        if (this.committed) {
            return;
        }

        this.rolledBack = true;

        if (this.transaction) {
            await this.transaction.rollback().execute();
        }
    }

    async commit(
        collections: [EntityClass, Collection<Entity>][]
    ): Promise<void> {
        if (this.committed || this.rolledBack) {
            return;
        }

        this.committed = true;

        const tx = this.getTransaction();
        const allEntities: Entity[] = [];

        for (const [entityClass, collection] of collections) {
            for (const entity of collection.values()) {
                if (entity instanceof DraftInvoice) {
                    const storage = new DraftInvoiceStorage(tx);
                    const record =
                        DraftInvoiceDataMapper.from(entity).toRecord();
                    await storage.merge(record);
                } else if (entity instanceof Invoice) {
                    const storage = new InvoiceStorage(tx);
                    const record = InvoiceDataMapper.from(entity).toRecord();
                    await storage.merge(record);
                } else {
                    const store = this.stores.get(entityClass);

                    if (store) {
                        const id = entity.id.toString();
                        const data = this.toRecord(entity);
                        const expectedVersion = this.getTrackedVersion(
                            entityClass,
                            id
                        );
                        store.setIfVersion(id, data, expectedVersion);
                    }
                }

                allEntities.push(entity);
            }
        }

        await tx.commit().execute();
        await this.domainEvents.publishEvents(...allEntities);
    }

    private getFromStore(entityClass: EntityClass, id: string): Entity | null {
        const store = this.stores.get(entityClass);

        if (!store) {
            return null;
        }

        const record = store.get(id);

        if (!record) {
            return null;
        }

        this.trackVersion(entityClass, id, record.version);

        return this.fromRecord(entityClass, record.value);
    }

    private fromRecord(
        entityClass: EntityClass,
        record: Record<string, unknown>
    ): Entity {
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
        this.versions.get(entityClass)?.set(id, version);
    }

    private getTrackedVersion(
        entityClass: EntityClass,
        id: string
    ): number | null {
        return this.versions.get(entityClass)?.get(id) ?? null;
    }

    private async initTransaction(): Promise<void> {
        this.transaction = await kysely.startTransaction().execute();
    }

    private getTransaction(): ControlledTransaction {
        if (!this.transaction) {
            throw new Error('Transaction not initialized');
        }

        return this.transaction;
    }
}
