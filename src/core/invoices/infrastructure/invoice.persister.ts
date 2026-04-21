import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { Invoice } from '../domain/invoice/invoice.ts';
import {
    InvoiceDataMapper,
    InvoiceRecord,
} from './mappers/invoice.data-mapper.ts';

const selectInvoice = (tx: ControlledTransaction, id: string) =>
    tx
        .selectFrom('invoices')
        .where('invoices.id', '=', id)
        .leftJoin(
            'invoice_line_items',
            'invoice_line_items.invoice_id',
            'invoices.id'
        )
        .leftJoin(
            'invoice_paypal_billings',
            'invoice_paypal_billings.invoice_id',
            'invoices.id'
        )
        .selectAll(['invoices'])
        .select([
            'invoice_line_items.id as invoice_line_item_id',
            'invoice_line_items.invoice_id as invoice_line_item_invoice_id',
            'invoice_line_items.description as invoice_line_item_description',
            'invoice_line_items.price_amount as invoice_line_item_price_amount',
            'invoice_line_items.price_currency as invoice_line_item_price_currency',
            'invoice_line_items.quantity as invoice_line_item_quantity',
            'invoice_line_items.total_amount as invoice_line_item_total_amount',
            'invoice_line_items.total_currency as invoice_line_item_total_currency',
            'invoice_line_items.created_at as invoice_line_item_created_at',
            'invoice_line_items.updated_at as invoice_line_item_updated_at',
            'invoice_paypal_billings.id as invoice_paypal_billing_id',
            'invoice_paypal_billings.invoice_id as invoice_paypal_billing_invoice_id',
            'invoice_paypal_billings.email as invoice_paypal_billing_email',
            'invoice_paypal_billings.created_at as invoice_paypal_billing_created_at',
            'invoice_paypal_billings.updated_at as invoice_paypal_billing_updated_at',
        ])
        .forUpdate('invoices')
        .execute();

export type InvoiceRow = Awaited<ReturnType<typeof selectInvoice>>[number];

const mergeInvoice = async (
    tx: ControlledTransaction,
    record: InvoiceRecord
) => {
    const now = new Date();

    await tx
        .mergeInto('invoices')
        .using(
            sql<{ id: string }>`(SELECT ${record.id.value}::uuid AS id)`.as(
                'source'
            ),
            (join) => join.onRef('invoices.id', '=', 'source.id')
        )
        .whenMatched()
        .thenUpdateSet({
            status: record.status.value,
            updated_at: now,
        })
        .whenNotMatched()
        .thenInsertValues({
            id: record.id.value,
            status: record.status.value,
            vat_rate: record.vatRate?.value.value ?? null,
            vat_amount: record.vatAmount?.amount.value ?? null,
            vat_currency: record.vatAmount?.currency.code ?? null,
            subtotal_amount: record.lineItems.subtotal.amount.value,
            subtotal_currency: record.lineItems.subtotal.currency.code,
            total_amount: record.total.amount.value,
            total_currency: record.total.currency.code,
            issue_date: record.issueDate.value,
            due_date: record.dueDate.value,
            issuer_type: record.issuer.type,
            issuer_name: record.issuer.name,
            issuer_address: record.issuer.address,
            issuer_tax_id: record.issuer.taxId,
            issuer_email: record.issuer.email.value,
            recipient_type: record.recipient.type,
            recipient_name: record.recipient.name,
            recipient_address: record.recipient.address,
            recipient_tax_id: record.recipient.taxId,
            recipient_email: record.recipient.email.value,
            recipient_tax_residence_country:
                record.recipient.taxResidenceCountry.code,
            updated_at: now,
        })
        .execute();

    await tx
        .mergeInto('invoice_line_items')
        .using(
            sql<{
                invoice_id: string;
            }>`(SELECT ${record.id.value}::uuid AS invoice_id)`.as('source'),
            (join) =>
                join.onRef(
                    'invoice_line_items.invoice_id',
                    '=',
                    'source.invoice_id'
                )
        )
        .whenNotMatched()
        .thenInsertValues(
            record.lineItems.items.map((item) => ({
                id: item.id.value,
                invoice_id: record.id.value,
                description: item.description.value,
                price_amount: item.price.amount.value,
                price_currency: item.price.currency.code,
                quantity: item.quantity.value.value,
                total_amount: item.total.amount.value,
                total_currency: item.total.currency.code,
            }))
        )
        .whenMatched()
        .thenDoNothing()
        .execute();

    await tx
        .mergeInto('invoice_paypal_billings')
        .using(
            sql<{
                invoice_id: string;
            }>`(SELECT ${record.id.value}::uuid AS invoice_id)`.as('source'),
            (join) =>
                join.onRef(
                    'invoice_paypal_billings.invoice_id',
                    '=',
                    'source.invoice_id'
                )
        )
        .whenNotMatched()
        .thenInsertValues({
            invoice_id: record.id.value,
            email: record.recipient.billing.data.email.value,
        })
        .whenMatched()
        .thenDoNothing()
        .execute();
};

export class InvoicePersister implements EntityPersister<Invoice> {
    readonly entityClass = Invoice;

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<Invoice | null> {
        const rows = await selectInvoice(tx, id);

        if (rows.length === 0) {
            return null;
        }

        return InvoiceDataMapper.fromRows(rows);
    }

    async merge(tx: ControlledTransaction, entity: Invoice): Promise<void> {
        const record = InvoiceDataMapper.from(entity).toRecord();
        await mergeInvoice(tx, record);
    }
}
