import { DraftInvoice } from '../../core/invoices/domain/draft-invoice/draft-invoice';
import { Invoice } from '../../core/invoices/domain/invoice/invoice';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';
import {
    EntityClass,
    PersistentManager as PersistentManagerInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import type { Collection } from '../../core/shared/unit-of-work/collection/collection';
import { kysely, ControlledTransaction } from '../../../database/kysely';
import { DraftInvoiceStorage } from './draft-invoice-storage';
import { InvoiceStorage } from './invoice-storage';
import { DraftInvoiceDataMapper } from './mappers/invoices/draft-invoice.data-mapper';
import { InvoiceDataMapper } from './mappers/invoices/invoice.data-mapper';

type Entity = DraftInvoice | Invoice;

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private committed = false;
    private rolledBack = false;
    private transaction: ControlledTransaction | null = null;
    private draftInvoiceStorage: DraftInvoiceStorage | null = null;
    private invoiceStorage: InvoiceStorage | null = null;

    constructor(private readonly domainEvents: DomainEvents) {}

    async fork(): Promise<PersistentManagerInterface<Entity>> {
        const newManager = new PersistentManager(this.domainEvents);
        await newManager.initTransaction();

        return newManager;
    }

    async get(entityClass: EntityClass, id: string): Promise<Entity | null> {
        if (!UUID_RE.test(id)) {
            return null;
        }

        if (entityClass === DraftInvoice) {
            const rows = await this.getDraftInvoiceStorage().select(id);

            if (rows.length === 0) {
                return null;
            }

            return DraftInvoiceDataMapper.fromRows(rows);
        }

        if (entityClass === Invoice) {
            const rows = await this.getInvoiceStorage().select(id);

            if (rows.length === 0) {
                return null;
            }

            return InvoiceDataMapper.fromRows(rows);
        }

        throw new Error(`Unknown entity class: ${entityClass.name}`);
    }

    async findBy(): Promise<Entity | null> {
        throw new Error('Not implemented');
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

        const allEntities: Entity[] = [];

        for (const [, collection] of collections) {
            for (const entity of collection.values()) {
                if (entity instanceof DraftInvoice) {
                    const record =
                        DraftInvoiceDataMapper.from(entity).toRecord();
                    await this.getDraftInvoiceStorage().merge(record);
                } else if (entity instanceof Invoice) {
                    const record = InvoiceDataMapper.from(entity).toRecord();
                    await this.getInvoiceStorage().merge(record);
                }

                allEntities.push(entity);
            }
        }

        await this.getTransaction().commit().execute();
        await this.domainEvents.publishEvents(...allEntities);
    }

    private async initTransaction(): Promise<void> {
        this.transaction = await kysely.startTransaction().execute();
        this.draftInvoiceStorage = new DraftInvoiceStorage(this.transaction);
        this.invoiceStorage = new InvoiceStorage(this.transaction);
    }

    private getTransaction(): ControlledTransaction {
        if (!this.transaction) {
            throw new Error('Transaction not initialized');
        }

        return this.transaction;
    }

    private getDraftInvoiceStorage(): DraftInvoiceStorage {
        if (!this.draftInvoiceStorage) {
            throw new Error('Transaction not initialized');
        }

        return this.draftInvoiceStorage;
    }

    private getInvoiceStorage(): InvoiceStorage {
        if (!this.invoiceStorage) {
            throw new Error('Transaction not initialized');
        }

        return this.invoiceStorage;
    }
}
