import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import dayjs from '../../../lib/dayjs/dayjs.ts';
import { pick } from '../../../lib/pick/pick.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { DraftInvoice } from '../domain/draft-invoice/draft-invoice.ts';
import {
    DraftInvoiceDataMapper,
    DraftInvoiceRecord,
} from './mappers/draft-invoice.data-mapper.ts';

export class DraftInvoicePersister implements EntityPersister<DraftInvoice> {
    readonly entityClass = DraftInvoice;
    private readonly selectedDraftInvoices = new WeakSet<DraftInvoice>();

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<DraftInvoice | null> {
        const rows = await tx
            .selectFrom('draft_invoices')
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
            .where('draft_invoices.id', '=', id)
            .modifyEnd(sql`for update of draft_invoices`)
            .select([
                'draft_invoices.id as inv_id',
                'draft_invoices.status as inv_status',
                'draft_invoices.vat_rate as inv_vat_rate',
                'draft_invoices.vat_amount as inv_vat_amount',
                'draft_invoices.vat_currency as inv_vat_currency',
                'draft_invoices.subtotal_amount as inv_subtotal_amount',
                'draft_invoices.subtotal_currency as inv_subtotal_currency',
                'draft_invoices.total_amount as inv_total_amount',
                'draft_invoices.total_currency as inv_total_currency',
                'draft_invoices.issue_date as inv_issue_date',
                'draft_invoices.due_date as inv_due_date',
                'draft_invoices.issuer_type as inv_issuer_type',
                'draft_invoices.issuer_name as inv_issuer_name',
                'draft_invoices.issuer_address as inv_issuer_address',
                'draft_invoices.issuer_tax_id as inv_issuer_tax_id',
                'draft_invoices.issuer_email as inv_issuer_email',
                'draft_invoices.recipient_type as inv_recipient_type',
                'draft_invoices.recipient_name as inv_recipient_name',
                'draft_invoices.recipient_address as inv_recipient_address',
                'draft_invoices.recipient_tax_id as inv_recipient_tax_id',
                'draft_invoices.recipient_email as inv_recipient_email',
                'draft_invoices.recipient_tax_residence_country as inv_recipient_tax_residence_country',
                'draft_invoice_line_items.id as li_id',
                'draft_invoice_line_items.draft_invoice_id as li_draft_invoice_id',
                'draft_invoice_line_items.description as li_description',
                'draft_invoice_line_items.price_amount as li_price_amount',
                'draft_invoice_line_items.price_currency as li_price_currency',
                'draft_invoice_line_items.quantity as li_quantity',
                'draft_invoice_line_items.total_amount as li_total_amount',
                'draft_invoice_line_items.total_currency as li_total_currency',
                'draft_invoice_paypal_billings.draft_invoice_id as pb_draft_invoice_id',
                'draft_invoice_paypal_billings.email as pb_email',
            ])
            .execute();

        if (rows.length === 0) {
            return null;
        }

        const draftInvoice = pick(rows, 'inv_')[0];
        const paypalRow = pick(rows, 'pb_')[0];
        const paypalBilling =
            paypalRow.draft_invoice_id !== null && paypalRow.email !== null
                ? {
                      draft_invoice_id: paypalRow.draft_invoice_id,
                      email: paypalRow.email,
                  }
                : null;
        const lineItems = pick(rows, 'li_').filter(
            (
                item
            ): item is {
                [K in keyof typeof item]: NonNullable<(typeof item)[K]>;
            } => item.id !== null
        );

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
            issuer_type:
                draftInvoice.issuer_type as DraftInvoiceRecord['issuer_type'],
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
            draft_invoice_paypal_billings: paypalBilling,
        };

        const entity = DraftInvoiceDataMapper.fromRecord(record);
        this.selectedDraftInvoices.add(entity);

        return entity;
    }

    async merge(
        tx: ControlledTransaction,
        entity: DraftInvoice
    ): Promise<void> {
        const record = DraftInvoiceDataMapper.from(entity).toRecord();
        const now = new Date();
        const isSelectedDraftInvoice = this.selectedDraftInvoices.has(entity);

        if (isSelectedDraftInvoice) {
            await tx
                .updateTable('draft_invoices')
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
                .insertInto('draft_invoices')
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

        this.selectedDraftInvoices.add(entity);

        if (isSelectedDraftInvoice) {
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

            return;
        }

        if (record.line_items.length > 0) {
            await tx
                .insertInto('draft_invoice_line_items')
                .values(
                    record.line_items.map((item) => ({
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
                    }))
                )
                .execute();
        }

        if (record.draft_invoice_paypal_billings) {
            await tx
                .insertInto('draft_invoice_paypal_billings')
                .values({
                    draft_invoice_id: record.id,
                    email: record.draft_invoice_paypal_billings.email,
                })
                .execute();
        }
    }
}
