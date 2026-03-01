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

type Entity = DraftInvoice | Invoice | AuthflowPolicy | FinancialDocument;

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private committed = false;
    private rolledBack = false;
    private tranasction: ControlledTransaction | null = null;

    constructor(private readonly domainEvents: DomainEvents) {}

    async fork(): Promise<PersistentManagerInterface<Entity>> {
        const newManager = new PersistentManager(this.domainEvents);
        await newManager.initTransaction();

        return newManager;
    }

    async get(entityClass: EntityClass, id: string): Promise<Entity | null> {
        if (entityClass === DraftInvoice) {
            const draftInvoiceRecords = await this.getTransaction()
                .selectFrom('draft_invoices')
                .where('draft_invoices.id', '=', id)
                .leftJoin(
                    'draft_invoice_line_items',
                    'draft_invoice_line_items.draft_invoice_id',
                    'draft_invoices.id'
                )
                .leftJoin(
                    'draft_invoice_paypal_billings',
                    'draft_invoice_paypal_billings.draft_invoice_id',
                    'draft_invoices.id'
                )
                .selectAll('draft_invoices')
                .select([
                    'draft_invoice_line_items.id as line_item_id',
                    'draft_invoice_line_items.description as line_item_description',
                    'draft_invoice_line_items.price_amount as line_item_price_amount',
                    'draft_invoice_line_items.price_currency as line_item_price_currency',
                    'draft_invoice_line_items.quantity as line_item_quantity',
                    'draft_invoice_line_items.total_amount as line_item_total_amount',
                    'draft_invoice_line_items.total_currency as line_item_total_currency',
                    'draft_invoice_paypal_billings.email as paypal_billing_email',
                ])
                .forUpdate()
                .executeTakeFirst();
        }

        throw new Error(`Unknown entity class: ${entityClass.name}`);
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
        if (this.committed) {
            return;
        }

        this.rolledBack = true;

        await this.getTransaction().rollback().execute();
    }

    async commit(
        collections: [EntityClass, Collection<Entity>][]
    ): Promise<void> {
        throw new Error('Unimplemented');
    }

    private async initTransaction(): Promise<void> {
        this.tranasction = await kysely.startTransaction().execute();
    }

    private getTransaction(): ControlledTransaction {
        if (!this.tranasction) {
            throw new Error('Transaction not initialized');
        }

        return this.tranasction;
    }
}
