import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import dayjs from '../../../lib/dayjs/dayjs.ts';
import { pick } from '../../../lib/pick/pick.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { Invoice } from '../domain/invoice/invoice.ts';
import {
    InvoiceDataMapper,
    InvoiceRecord,
} from './mappers/invoice.data-mapper.ts';

export class InvoicePersister implements EntityPersister<Invoice> {
    readonly entityClass = Invoice;
    private readonly selectedInvoices = new WeakSet<Invoice>();

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<Invoice | null> {
        const rows = await tx
            .selectFrom('invoices')
            .leftJoin(
                'invoice_line_items',
                'invoice_line_items.invoice_id',
                'invoices.id'
            )
            .innerJoin(
                'invoice_paypal_billings',
                'invoice_paypal_billings.invoice_id',
                'invoices.id'
            )
            .where('invoices.id', '=', id)
            .modifyEnd(sql`for update of invoices`)
            .select([
                'invoices.id as inv_id',
                'invoices.status as inv_status',
                'invoices.vat_rate as inv_vat_rate',
                'invoices.vat_amount as inv_vat_amount',
                'invoices.vat_currency as inv_vat_currency',
                'invoices.subtotal_amount as inv_subtotal_amount',
                'invoices.subtotal_currency as inv_subtotal_currency',
                'invoices.total_amount as inv_total_amount',
                'invoices.total_currency as inv_total_currency',
                'invoices.issue_date as inv_issue_date',
                'invoices.due_date as inv_due_date',
                'invoices.issuer_type as inv_issuer_type',
                'invoices.issuer_name as inv_issuer_name',
                'invoices.issuer_address as inv_issuer_address',
                'invoices.issuer_tax_id as inv_issuer_tax_id',
                'invoices.issuer_email as inv_issuer_email',
                'invoices.recipient_type as inv_recipient_type',
                'invoices.recipient_name as inv_recipient_name',
                'invoices.recipient_address as inv_recipient_address',
                'invoices.recipient_tax_id as inv_recipient_tax_id',
                'invoices.recipient_email as inv_recipient_email',
                'invoices.recipient_tax_residence_country as inv_recipient_tax_residence_country',
                'invoice_line_items.id as li_id',
                'invoice_line_items.invoice_id as li_invoice_id',
                'invoice_line_items.description as li_description',
                'invoice_line_items.price_amount as li_price_amount',
                'invoice_line_items.price_currency as li_price_currency',
                'invoice_line_items.quantity as li_quantity',
                'invoice_line_items.total_amount as li_total_amount',
                'invoice_line_items.total_currency as li_total_currency',
                'invoice_paypal_billings.invoice_id as pb_invoice_id',
                'invoice_paypal_billings.email as pb_email',
            ])
            .execute();

        if (rows.length === 0) {
            return null;
        }

        const invoice = pick(rows, 'inv_')[0];
        const paypalBilling = pick(rows, 'pb_')[0];
        const lineItems = pick(rows, 'li_').filter(
            (
                item
            ): item is {
                [K in keyof typeof item]: NonNullable<(typeof item)[K]>;
            } => item.id !== null
        );

        const record: InvoiceRecord = {
            id: invoice.id,
            status: invoice.status as InvoiceRecord['status'],
            vat_rate: invoice.vat_rate,
            vat_amount: invoice.vat_amount,
            vat_currency: invoice.vat_currency,
            subtotal_amount: invoice.subtotal_amount,
            subtotal_currency: invoice.subtotal_currency,
            total_amount: invoice.total_amount,
            total_currency: invoice.total_currency,
            issue_date: dayjs(invoice.issue_date).format('YYYY-MM-DD'),
            due_date: dayjs(invoice.due_date).format('YYYY-MM-DD'),
            issuer_type: invoice.issuer_type as InvoiceRecord['issuer_type'],
            issuer_name: invoice.issuer_name,
            issuer_address: invoice.issuer_address,
            issuer_tax_id: invoice.issuer_tax_id,
            issuer_email: invoice.issuer_email,
            recipient_type:
                invoice.recipient_type as InvoiceRecord['recipient_type'],
            recipient_name: invoice.recipient_name,
            recipient_address: invoice.recipient_address,
            recipient_tax_id: invoice.recipient_tax_id,
            recipient_email: invoice.recipient_email,
            recipient_tax_residence_country:
                invoice.recipient_tax_residence_country,
            line_items: lineItems,
            invoice_paypal_billings: paypalBilling,
        };

        const entity = InvoiceDataMapper.fromRecord(record);
        this.selectedInvoices.add(entity);

        return entity;
    }

    async merge(tx: ControlledTransaction, entity: Invoice): Promise<void> {
        const record = InvoiceDataMapper.from(entity).toRecord();
        const now = new Date();
        const isSelectedInvoice = this.selectedInvoices.has(entity);

        if (isSelectedInvoice) {
            await tx
                .updateTable('invoices')
                .set({
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
                    updated_at: now,
                })
                .where('id', '=', record.id)
                .execute();
        } else {
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
        }

        this.selectedInvoices.add(entity);

        if (isSelectedInvoice) {
            for (const item of record.line_items) {
                await tx
                    .mergeInto('invoice_line_items')
                    .using(
                        sql<{ id: string }>`(SELECT ${item.id}::uuid AS id)`.as(
                            'source'
                        ),
                        (join) =>
                            join.onRef(
                                'invoice_line_items.id',
                                '=',
                                'source.id'
                            )
                    )
                    .whenMatched()
                    .thenUpdateSet({
                        description: item.description,
                        price_amount: item.price_amount,
                        price_currency: item.price_currency,
                        quantity: item.quantity,
                        total_amount: item.total_amount,
                        total_currency: item.total_currency,
                        updated_at: now,
                    })
                    .whenNotMatched()
                    .thenInsertValues({
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
                    })
                    .execute();
            }

            let pruneQuery = tx
                .deleteFrom('invoice_line_items')
                .where('invoice_id', '=', record.id);

            if (record.line_items.length > 0) {
                pruneQuery = pruneQuery.where(
                    'id',
                    'not in',
                    record.line_items.map((item) => item.id)
                );
            }

            await pruneQuery.execute();

            await tx
                .mergeInto('invoice_paypal_billings')
                .using(
                    sql<{
                        invoice_id: string;
                    }>`(SELECT ${record.id}::uuid AS invoice_id)`.as('source'),
                    (join) =>
                        join.onRef(
                            'invoice_paypal_billings.invoice_id',
                            '=',
                            'source.invoice_id'
                        )
                )
                .whenMatched()
                .thenUpdateSet({
                    email: record.invoice_paypal_billings.email,
                    updated_at: now,
                })
                .whenNotMatched()
                .thenInsertValues({
                    invoice_id: record.id,
                    email: record.invoice_paypal_billings.email,
                })
                .execute();

            return;
        }

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
}
