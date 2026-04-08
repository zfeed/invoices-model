import { sql } from 'kysely';
import { ControlledTransaction } from '../../../../database/kysely';
import { DraftInvoiceRecord } from './mappers/draft-invoice.data-mapper';

export class DraftInvoiceStorage {
    constructor(private tx: ControlledTransaction) {}

    select(id: string) {
        return this.tx
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
            .selectAll(['draft_invoices'])
            .select([
                // draft_invoice_line_items
                'draft_invoice_line_items.id as draft_invoice_line_item_id',
                'draft_invoice_line_items.draft_invoice_id as draft_invoice_line_item_draft_invoice_id',
                'draft_invoice_line_items.description as draft_invoice_line_item_description',
                'draft_invoice_line_items.price_amount as draft_invoice_line_item_price_amount',
                'draft_invoice_line_items.price_currency as draft_invoice_line_item_price_currency',
                'draft_invoice_line_items.quantity as draft_invoice_line_item_quantity',
                'draft_invoice_line_items.total_amount as draft_invoice_line_item_total_amount',
                'draft_invoice_line_items.total_currency as draft_invoice_line_item_total_currency',
                'draft_invoice_line_items.created_at as draft_invoice_line_item_created_at',
                'draft_invoice_line_items.updated_at as draft_invoice_line_item_updated_at',
                // draft_invoice_paypal_billings
                'draft_invoice_paypal_billings.id as draft_invoice_paypal_billing_id',
                'draft_invoice_paypal_billings.draft_invoice_id as draft_invoice_paypal_billing_draft_invoice_id',
                'draft_invoice_paypal_billings.email as draft_invoice_paypal_billing_email',
                'draft_invoice_paypal_billings.created_at as draft_invoice_paypal_billing_created_at',
                'draft_invoice_paypal_billings.updated_at as draft_invoice_paypal_billing_updated_at',
            ])
            .forUpdate('draft_invoices')
            .execute();
    }

    async merge(record: DraftInvoiceRecord) {
        const now = new Date();

        await this.tx
            .mergeInto('draft_invoices')
            .using(
                sql<{ id: string }>`(SELECT ${record.id.value}::uuid AS id)`.as(
                    'source'
                ),
                (join) => join.onRef('draft_invoices.id', '=', 'source.id')
            )
            .whenMatched()
            .thenUpdateSet({
                status: record.status.value,
                vat_rate: record.vatRate?.value.value ?? null,
                vat_amount: record.vatAmount?.amount.value ?? null,
                vat_currency: record.vatAmount?.currency.code ?? null,
                subtotal_amount:
                    record.lineItems?.subtotal.amount.value ?? null,
                subtotal_currency:
                    record.lineItems?.subtotal.currency.code ?? null,
                total_amount: record.total?.amount.value ?? null,
                total_currency: record.total?.currency.code ?? null,
                issue_date: record.issueDate?.value ?? null,
                due_date: record.dueDate?.value ?? null,
                issuer_type: record.issuer?.type ?? null,
                issuer_name: record.issuer?.name ?? null,
                issuer_address: record.issuer?.address ?? null,
                issuer_tax_id: record.issuer?.taxId ?? null,
                issuer_email: record.issuer?.email.value ?? null,
                recipient_type: record.recipient?.type ?? null,
                recipient_name: record.recipient?.name ?? null,
                recipient_address: record.recipient?.address ?? null,
                recipient_tax_id: record.recipient?.taxId ?? null,
                recipient_email: record.recipient?.email.value ?? null,
                recipient_tax_residence_country:
                    record.recipient?.taxResidenceCountry.code ?? null,
                updated_at: now,
            })
            .whenNotMatched()
            .thenInsertValues({
                id: record.id.value,
                status: record.status.value,
                vat_rate: record.vatRate?.value.value ?? null,
                vat_amount: record.vatAmount?.amount.value ?? null,
                vat_currency: record.vatAmount?.currency.code ?? null,
                subtotal_amount:
                    record.lineItems?.subtotal.amount.value ?? null,
                subtotal_currency:
                    record.lineItems?.subtotal.currency.code ?? null,
                total_amount: record.total?.amount.value ?? null,
                total_currency: record.total?.currency.code ?? null,
                issue_date: record.issueDate?.value ?? null,
                due_date: record.dueDate?.value ?? null,
                issuer_type: record.issuer?.type ?? null,
                issuer_name: record.issuer?.name ?? null,
                issuer_address: record.issuer?.address ?? null,
                issuer_tax_id: record.issuer?.taxId ?? null,
                issuer_email: record.issuer?.email.value ?? null,
                recipient_type: record.recipient?.type ?? null,
                recipient_name: record.recipient?.name ?? null,
                recipient_address: record.recipient?.address ?? null,
                recipient_tax_id: record.recipient?.taxId ?? null,
                recipient_email: record.recipient?.email.value ?? null,
                recipient_tax_residence_country:
                    record.recipient?.taxResidenceCountry.code ?? null,
                created_at: now,
                updated_at: now,
            })
            .execute();

        await this.tx
            .deleteFrom('draft_invoice_line_items')
            .where('draft_invoice_id', '=', record.id.value)
            .execute();

        if (record.lineItems) {
            await this.tx
                .insertInto('draft_invoice_line_items')
                .values(
                    record.lineItems.items.map((item) => ({
                        id: item.id.value,
                        draft_invoice_id: record.id.value,
                        description: item.description.value,
                        price_amount: item.price.amount.value,
                        price_currency: item.price.currency.code,
                        quantity: item.quantity.value.value,
                        total_amount: item.total.amount.value,
                        total_currency: item.total.currency.code,
                    }))
                )
                .execute();
        }

        if (record.recipient?.billing) {
            await this.tx
                .mergeInto('draft_invoice_paypal_billings')
                .using(
                    sql<{
                        draft_invoice_id: string;
                    }>`(SELECT ${record.id.value}::uuid AS draft_invoice_id)`.as(
                        'source'
                    ),
                    (join) =>
                        join.onRef(
                            'draft_invoice_paypal_billings.draft_invoice_id',
                            '=',
                            'source.draft_invoice_id'
                        )
                )
                .whenMatched()
                .thenUpdateSet({
                    email: record.recipient.billing.data.email.value,
                    updated_at: now,
                })
                .whenNotMatched()
                .thenInsertValues({
                    draft_invoice_id: record.id.value,
                    email: record.recipient.billing.data.email.value,
                })
                .execute();
        } else {
            await this.tx
                .deleteFrom('draft_invoice_paypal_billings')
                .where('draft_invoice_id', '=', record.id.value)
                .execute();
        }
    }
}
