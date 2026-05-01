import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import dayjs from '../../../lib/dayjs/dayjs.ts';
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
        const invoice = await tx
            .selectFrom('invoices')
            .selectAll()
            .where('invoices.id', '=', id)
            .forUpdate()
            .executeTakeFirst();

        if (!invoice) {
            return null;
        }

        const lineItems = await tx
            .selectFrom('invoice_line_items')
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
            .where('invoice_id', '=', id)
            .execute();

        const paypalBilling = await tx
            .selectFrom('invoice_paypal_billings')
            .select(['invoice_id', 'email'])
            .where('invoice_id', '=', id)
            .executeTakeFirstOrThrow();

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
