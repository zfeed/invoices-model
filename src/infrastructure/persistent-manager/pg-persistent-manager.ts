import { AuthflowPolicy } from '../../core/financial-authorization/domain/authflow/authflow-policy';
import { FinancialDocument } from '../../core/financial-authorization/domain/document/document';
import { DraftInvoice } from '../../core/invoices/domain/draft-invoice/draft-invoice';
import { Invoice } from '../../core/invoices/domain/invoice/invoice';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';
import {
    EntityClass,
    PersistentManager as PersistentManagerInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import type { Collection } from '../../core/shared/unit-of-work/collection/collection';
import dayjs from '../../lib/dayjs';
import { kysely, ControlledTransaction } from '../../../database/kysely';
import { EventOutboxStorage } from '../event-outbox/event-outbox';
import { AuthflowPolicyStorage } from './authflow-policy-storage';
import { DraftInvoiceStorage } from './draft-invoice-storage';
import { FinancialDocumentStorage } from './financial-document-storage';
import { InvoiceStorage } from './invoice-storage';
import { AuthflowPolicyDataMapper } from './mappers/financial-authorization/authflow-policy.data-mapper';
import { FinancialDocumentDataMapper } from './mappers/financial-authorization/financial-document.data-mapper';
import { DraftInvoiceDataMapper } from './mappers/invoices/draft-invoice.data-mapper';
import { InvoiceDataMapper } from './mappers/invoices/invoice.data-mapper';

type Entity = DraftInvoice | Invoice | AuthflowPolicy | FinancialDocument;

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private committed = false;
    private transaction: ControlledTransaction | null = null;
    private draftInvoiceStorage: DraftInvoiceStorage | null = null;
    private invoiceStorage: InvoiceStorage | null = null;
    private financialDocumentStorage: FinancialDocumentStorage | null = null;
    private authflowPolicyStorage: AuthflowPolicyStorage | null = null;
    private eventOutboxStorage: EventOutboxStorage | null = null;

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

        if (entityClass === FinancialDocument) {
            const rows = await this.getFinancialDocumentStorage().select(id);

            if (!rows) {
                return null;
            }

            return FinancialDocumentDataMapper.fromRows(rows);
        }

        if (entityClass === AuthflowPolicy) {
            const rows = await this.getAuthflowPolicyStorage().select(id);

            if (!rows) {
                return null;
            }

            return AuthflowPolicyDataMapper.fromRows(rows);
        }

        throw new Error(`Unknown entity class: ${entityClass.name}`);
    }

    async findBy(
        entityClass: EntityClass,
        key: string,
        value: string
    ): Promise<Entity | null> {
        if (entityClass === FinancialDocument && key === 'referenceId') {
            const rows =
                await this.getFinancialDocumentStorage().selectByReferenceId(
                    value
                );

            if (!rows) {
                return null;
            }

            return FinancialDocumentDataMapper.fromRows(rows);
        }

        if (entityClass === AuthflowPolicy && key === 'action') {
            const rows =
                await this.getAuthflowPolicyStorage().selectByAction(value);

            if (!rows) {
                return null;
            }

            return AuthflowPolicyDataMapper.fromRows(rows);
        }

        throw new Error('Not implemented');
    }

    async rollback(): Promise<void> {
        if (this.committed) {
            return;
        }

        if (this.transaction) {
            await this.transaction.rollback().execute();
        }
    }

    async commit(
        collections: [EntityClass, Collection<Entity>][]
    ): Promise<void> {
        if (this.committed) {
            throw new Error('Transaction already committed');
        }

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
                } else if (entity instanceof FinancialDocument) {
                    const record =
                        FinancialDocumentDataMapper.from(entity).toRecord();
                    await this.getFinancialDocumentStorage().merge(record);
                } else if (entity instanceof AuthflowPolicy) {
                    const record =
                        AuthflowPolicyDataMapper.from(entity).toRecord();
                    await this.getAuthflowPolicyStorage().merge(record);
                }

                allEntities.push(entity);
            }
        }

        await this.getEventOutboxStorage().insert(
            allEntities.flatMap((entity) => entity.events),
            { transaction: this.getTransaction() }
        );

        await this.getTransaction().commit().execute();
        this.committed = true;
        await this.domainEvents.publishEvents(...allEntities);
    }

    private async initTransaction(): Promise<void> {
        this.transaction = await kysely.startTransaction().execute();
        this.draftInvoiceStorage = new DraftInvoiceStorage(this.transaction);
        this.invoiceStorage = new InvoiceStorage(this.transaction);
        this.financialDocumentStorage = new FinancialDocumentStorage(
            this.transaction
        );
        this.authflowPolicyStorage = new AuthflowPolicyStorage(
            this.transaction
        );
        this.eventOutboxStorage = EventOutboxStorage.create([]);
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

    private getFinancialDocumentStorage(): FinancialDocumentStorage {
        if (!this.financialDocumentStorage) {
            throw new Error('Transaction not initialized');
        }

        return this.financialDocumentStorage;
    }

    private getAuthflowPolicyStorage(): AuthflowPolicyStorage {
        if (!this.authflowPolicyStorage) {
            throw new Error('Transaction not initialized');
        }

        return this.authflowPolicyStorage;
    }

    private getEventOutboxStorage(): EventOutboxStorage {
        if (!this.eventOutboxStorage) {
            throw new Error('Transaction not initialized');
        }

        return this.eventOutboxStorage;
    }
}
