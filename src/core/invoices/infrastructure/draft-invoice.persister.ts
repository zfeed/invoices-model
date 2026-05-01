import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import dayjs from '../../../lib/dayjs/dayjs.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { DraftInvoice } from '../domain/draft-invoice/draft-invoice.ts';
import {
    DraftInvoiceDataMapper,
    DraftInvoiceRecord,
} from './mappers/draft-invoice.data-mapper.ts';

export class DraftInvoicePersister implements EntityPersister<DraftInvoice> {
    readonly entityClass = DraftInvoice;

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<DraftInvoice | null> {
        const draftInvoice = await tx
            .selectFrom('draft_invoices')
            .selectAll()
            .where('draft_invoices.id', '=', id)
            .forUpdate()
            .executeTakeFirst();

        if (!draftInvoice) {
            return null;
        }

        const lineItems = await tx
            .selectFrom('draft_invoice_line_items')
            .select([
                'id',
                'draft_invoice_id',
                'description',
                'price_amount',
                'price_currency',
                'quantity',
                'total_amount',
                'total_currency',
            ])
            .where('draft_invoice_id', '=', id)
            .execute();

        const paypalBilling = await tx
            .selectFrom('draft_invoice_paypal_billings')
            .select(['draft_invoice_id', 'email'])
            .where('draft_invoice_id', '=', id)
            .executeTakeFirst();

        const record: DraftInvoiceRecord = {
            id: draftInvoice.id,
            status: draftInvoice.status as DraftInvoiceRecord['status'],
            vat_rate: draftInvoice.vat_rate,
            vat_amount: draftInvoice.vat_amount,
            vat_currency: draftInvoice.vat_currency,
            subtotal_amount: draftInvoice.subtotal_amount,
            subtotal_currency: draftInvoice.subtotal_currency,
            total_amount: draftInvoice.total_amount,
            total_currency: draftInvoice.total_currency,
            issue_date: draftInvoice.issue_date
                ? dayjs(draftInvoice.issue_date).format('YYYY-MM-DD')
                : null,
            due_date: draftInvoice.due_date
                ? dayjs(draftInvoice.due_date).format('YYYY-MM-DD')
                : null,
            issuer_type: draftInvoice.issuer_type as DraftInvoiceRecord['issuer_type'],
            issuer_name: draftInvoice.issuer_name,
            issuer_address: draftInvoice.issuer_address,
            issuer_tax_id: draftInvoice.issuer_tax_id,
            issuer_email: draftInvoice.issuer_email,
            recipient_type:
                draftInvoice.recipient_type as DraftInvoiceRecord['recipient_type'],
            recipient_name: draftInvoice.recipient_name,
            recipient_address: draftInvoice.recipient_address,
            recipient_tax_id: draftInvoice.recipient_tax_id,
            recipient_email: draftInvoice.recipient_email,
            recipient_tax_residence_country:
                draftInvoice.recipient_tax_residence_country,
            line_items: lineItems,
            draft_invoice_paypal_billings: paypalBilling ?? null,
        };

        return DraftInvoiceDataMapper.fromRecord(record);
    }

    async merge(
        tx: ControlledTransaction,
        entity: DraftInvoice
    ): Promise<void> {
        const record = DraftInvoiceDataMapper.from(entity).toRecord();
        const now = new Date();

        await tx
            .mergeInto('draft_invoices')
            .using(
                sql<{ id: string }>`(SELECT ${record.id}::uuid AS id)`.as(
                    'source'
                ),
                (join) => join.onRef('draft_invoices.id', '=', 'source.id')
            )
            .whenMatched()
            .thenUpdateSet({
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
            .whenNotMatched()
            .thenInsertValues({
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

        for (const item of record.line_items) {
            await tx
                .mergeInto('draft_invoice_line_items')
                .using(
                    sql<{ id: string }>`(SELECT ${item.id}::uuid AS id)`.as(
                        'source'
                    ),
                    (join) =>
                        join.onRef(
                            'draft_invoice_line_items.id',
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
                    draft_invoice_id: record.id,
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
            .deleteFrom('draft_invoice_line_items')
            .where('draft_invoice_id', '=', record.id);

        if (record.line_items.length > 0) {
            pruneQuery = pruneQuery.where(
                'id',
                'not in',
                record.line_items.map((item) => item.id)
            );
        }

        await pruneQuery.execute();

        if (record.draft_invoice_paypal_billings) {
            await tx
                .mergeInto('draft_invoice_paypal_billings')
                .using(
                    sql<{
                        draft_invoice_id: string;
                    }>`(SELECT ${record.id}::uuid AS draft_invoice_id)`.as(
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
                    email: record.draft_invoice_paypal_billings.email,
                    updated_at: now,
                })
                .whenNotMatched()
                .thenInsertValues({
                    draft_invoice_id: record.id,
                    email: record.draft_invoice_paypal_billings.email,
                })
                .execute();
        } else {
            await tx
                .deleteFrom('draft_invoice_paypal_billings')
                .where('draft_invoice_id', '=', record.id)
                .execute();
        }
    }
}
