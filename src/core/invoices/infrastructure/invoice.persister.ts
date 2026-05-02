import { sql } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import dayjs from '../../../lib/dayjs/dayjs.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { Invoice } from '../domain/invoice/invoice.ts';
import { assertNotNull } from '../../../lib/asserts/assert-not-null.ts';
import { addedDiff, deletedDiff, updatedDiff } from 'deep-object-diff';
import {
    InvoiceDataMapper,
    InvoiceRecord,
} from './mappers/invoice.data-mapper.ts';

export class InvoicePersister implements EntityPersister<Invoice> {
    readonly entityClass = Invoice;

    readonly #records = new WeakMap<Invoice, InvoiceRecord>();

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<Invoice | null> {
        const row = await tx
            .selectFrom('invoices')
            .where('invoices.id', '=', id)
            .modifyEnd(sql`for update of invoices`)
            .select((eb) => [
                'invoices.id',
                'invoices.status',
                'invoices.vat_rate',
                'invoices.vat_amount',
                'invoices.vat_currency',
                'invoices.subtotal_amount',
                'invoices.subtotal_currency',
                'invoices.total_amount',
                'invoices.total_currency',
                'invoices.issue_date',
                'invoices.due_date',
                'invoices.issuer_type',
                'invoices.issuer_name',
                'invoices.issuer_address',
                'invoices.issuer_tax_id',
                'invoices.issuer_email',
                'invoices.recipient_type',
                'invoices.recipient_name',
                'invoices.recipient_address',
                'invoices.recipient_tax_id',
                'invoices.recipient_email',
                'invoices.recipient_tax_residence_country',
                jsonArrayFrom(
                    eb
                        .selectFrom('invoice_line_items')
                        .whereRef(
                            'invoice_line_items.invoice_id',
                            '=',
                            'invoices.id'
                        )
                        .select([
                            'id',
                            'invoice_id',
                            'description',
                            'price_amount',
                            'price_currency',
                            'quantity',
                            'total_amount',
                            'total_currency',
                        ])
                ).as('line_items'),
                jsonObjectFrom(
                    eb
                        .selectFrom('invoice_paypal_billings')
                        .whereRef(
                            'invoice_paypal_billings.invoice_id',
                            '=',
                            'invoices.id'
                        )
                        .select(['invoice_id', 'email'])
                ).as('invoice_paypal_billings'),
            ])
            .executeTakeFirst();

        if (!row) {
            return null;
        }

        assertNotNull(row.invoice_paypal_billings);

        const record: InvoiceRecord = {
            id: row.id,
            status: row.status as InvoiceRecord['status'],
            vat_rate: row.vat_rate,
            vat_amount: row.vat_amount,
            vat_currency: row.vat_currency,
            subtotal_amount: row.subtotal_amount,
            subtotal_currency: row.subtotal_currency,
            total_amount: row.total_amount,
            total_currency: row.total_currency,
            issue_date: dayjs(row.issue_date).format('YYYY-MM-DD'),
            due_date: dayjs(row.due_date).format('YYYY-MM-DD'),
            issuer_type: row.issuer_type as InvoiceRecord['issuer_type'],
            issuer_name: row.issuer_name,
            issuer_address: row.issuer_address,
            issuer_tax_id: row.issuer_tax_id,
            issuer_email: row.issuer_email,
            recipient_type:
                row.recipient_type as InvoiceRecord['recipient_type'],
            recipient_name: row.recipient_name,
            recipient_address: row.recipient_address,
            recipient_tax_id: row.recipient_tax_id,
            recipient_email: row.recipient_email,
            recipient_tax_residence_country:
                row.recipient_tax_residence_country,
            line_items: row.line_items,
            invoice_paypal_billings: row.invoice_paypal_billings,
        };

        const entity = InvoiceDataMapper.fromRecord(record);
        this.#records.set(entity, record);

        return entity;
    }

    async create(tx: ControlledTransaction, entity: Invoice): Promise<void> {
        const record = InvoiceDataMapper.from(entity).toRecord();

        const now = new Date();

        await tx
            .insertInto('invoices')
            .values({
                id: record.id,
                status: record.status,
                vat_rate: record.vat_rate,
                vat_amount: record.vat_amount,
                vat_currency: record.vat_currency,
                subtotal_amount: record.subtotal_amount,
                subtotal_currency: record.subtotal_currency,
                total_amount: record.total_amount,
                total_currency: record.total_currency,
                issue_date: record.issue_date,
                due_date: record.due_date,
                issuer_type: record.issuer_type,
                issuer_name: record.issuer_name,
                issuer_address: record.issuer_address,
                issuer_tax_id: record.issuer_tax_id,
                issuer_email: record.issuer_email,
                recipient_type: record.recipient_type,
                recipient_name: record.recipient_name,
                recipient_address: record.recipient_address,
                recipient_tax_id: record.recipient_tax_id,
                recipient_email: record.recipient_email,
                recipient_tax_residence_country:
                    record.recipient_tax_residence_country,
                created_at: now,
                updated_at: now,
            })
            .execute();

        if (record.line_items.length > 0) {
            await tx
                .insertInto('invoice_line_items')
                .values(
                    record.line_items.map((item) => ({
                        id: item.id,
                        invoice_id: record.id,
                        description: item.description,
                        price_amount: item.price_amount,
                        price_currency: item.price_currency,
                        quantity: item.quantity,
                        total_amount: item.total_amount,
                        total_currency: item.total_currency,
                        created_at: now,
                        updated_at: now,
                    }))
                )
                .execute();
        }

        await tx
            .insertInto('invoice_paypal_billings')
            .values({
                invoice_id: record.id,
                email: record.invoice_paypal_billings.email,
            })
            .execute();
    }

    async merge(tx: ControlledTransaction, entity: Invoice): Promise<void> {
        const record = InvoiceDataMapper.from(entity).toRecord();
        const now = new Date();

        const originalRecord = this.#records.get(entity);

        assertNotNull(originalRecord);

        const {
            line_items: originalLineItems,
            invoice_paypal_billings: originalPaypal,
            ...originalScalars
        } = originalRecord;
        const {
            line_items: newLineItems,
            invoice_paypal_billings: newPaypal,
            ...newScalars
        } = record;

        const invoiceChanges = updatedDiff(
            originalScalars,
            newScalars
        ) as Partial<typeof newScalars>;

        if (Object.keys(invoiceChanges).length > 0) {
            await tx
                .updateTable('invoices')
                .set({ ...invoiceChanges, updated_at: now })
                .where('id', '=', record.id)
                .execute();
        }

        const originalLineItemsById = Object.fromEntries(
            originalLineItems.map((item) => [item.id, item])
        );
        const newLineItemsById = Object.fromEntries(
            newLineItems.map((item) => [item.id, item])
        );

        const addedLineItems = addedDiff(
            originalLineItemsById,
            newLineItemsById
        ) as Record<string, (typeof newLineItems)[number]>;
        const deletedLineItems = deletedDiff(
            originalLineItemsById,
            newLineItemsById
        ) as Record<string, unknown>;
        const updatedLineItems = updatedDiff(
            originalLineItemsById,
            newLineItemsById
        ) as Record<string, Partial<(typeof newLineItems)[number]>>;

        const deletedLineItemIds = Object.keys(deletedLineItems);
        if (deletedLineItemIds.length > 0) {
            await tx
                .deleteFrom('invoice_line_items')
                .where('id', 'in', deletedLineItemIds)
                .execute();
        }

        const addedLineItemValues = Object.keys(addedLineItems).map((id) => {
            const item = newLineItemsById[id];
            return {
                id: item.id,
                invoice_id: record.id,
                description: item.description,
                price_amount: item.price_amount,
                price_currency: item.price_currency,
                quantity: item.quantity,
                total_amount: item.total_amount,
                total_currency: item.total_currency,
                created_at: now,
                updated_at: now,
            };
        });

        if (addedLineItemValues.length > 0) {
            await tx
                .insertInto('invoice_line_items')
                .values(addedLineItemValues)
                .execute();
        }

        for (const [id, changes] of Object.entries(updatedLineItems)) {
            if (Object.keys(changes).length === 0) continue;
            await tx
                .updateTable('invoice_line_items')
                .set({ ...changes, updated_at: now })
                .where('id', '=', id)
                .execute();
        }

        const paypalChanges = updatedDiff(originalPaypal, newPaypal) as Partial<
            typeof newPaypal
        >;

        if (Object.keys(paypalChanges).length > 0) {
            await tx
                .updateTable('invoice_paypal_billings')
                .set({ ...paypalChanges, updated_at: now })
                .where('invoice_id', '=', record.id)
                .execute();
        }
    }
}
