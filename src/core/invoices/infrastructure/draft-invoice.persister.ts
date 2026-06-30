import { sql } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import dayjs from '../../../lib/dayjs/dayjs.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { DraftInvoice } from '../domain/draft-invoice/draft-invoice.ts';
import { assertNotNull } from '../../../lib/asserts/assert-not-null.ts';
import { addedDiff, deletedDiff, updatedDiff } from 'deep-object-diff';
import {
    DraftInvoiceDataMapper,
    DraftInvoiceRecord,
} from './mappers/draft-invoice.data-mapper.ts';
import { organizationContext } from '../../../lib/organization-context/organization-context.ts';

export class DraftInvoicePersister implements EntityPersister<DraftInvoice> {
    readonly entityClass = DraftInvoice;

    readonly #records = new WeakMap<DraftInvoice, DraftInvoiceRecord>();

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<DraftInvoice | null> {
        const organizationId = organizationContext.getOrganizationId();
        const row = await tx
            .selectFrom('draft_invoices')
            .where('draft_invoices.id', '=', id)
            .where('draft_invoices.organization_id', '=', organizationId)
            .modifyEnd(sql`for update of draft_invoices`)
            .select((eb) => [
                'draft_invoices.id',
                'draft_invoices.status',
                'draft_invoices.vat_rate',
                'draft_invoices.vat_amount',
                'draft_invoices.vat_currency',
                'draft_invoices.subtotal_amount',
                'draft_invoices.subtotal_currency',
                'draft_invoices.total_amount',
                'draft_invoices.total_currency',
                'draft_invoices.issue_date',
                'draft_invoices.due_date',
                'draft_invoices.issuer_type',
                'draft_invoices.issuer_name',
                'draft_invoices.issuer_address',
                'draft_invoices.issuer_tax_id',
                'draft_invoices.issuer_email',
                'draft_invoices.recipient_type',
                'draft_invoices.recipient_name',
                'draft_invoices.recipient_address',
                'draft_invoices.recipient_tax_id',
                'draft_invoices.recipient_email',
                'draft_invoices.recipient_tax_residence_country',
                jsonArrayFrom(
                    eb
                        .selectFrom('draft_invoice_line_items')
                        .whereRef(
                            'draft_invoice_line_items.draft_invoice_id',
                            '=',
                            'draft_invoices.id'
                        )
                        .where(
                            'draft_invoice_line_items.organization_id',
                            '=',
                            organizationId
                        )
                        .select([
                            'draft_invoice_line_items.id',
                            'draft_invoice_line_items.draft_invoice_id',
                            'draft_invoice_line_items.description',
                            'draft_invoice_line_items.price_amount',
                            'draft_invoice_line_items.price_currency',
                            'draft_invoice_line_items.quantity',
                            'draft_invoice_line_items.total_amount',
                            'draft_invoice_line_items.total_currency',
                        ])
                ).as('line_items'),
                jsonObjectFrom(
                    eb
                        .selectFrom('draft_invoice_paypal_billings')
                        .whereRef(
                            'draft_invoice_paypal_billings.draft_invoice_id',
                            '=',
                            'draft_invoices.id'
                        )
                        .where(
                            'draft_invoice_paypal_billings.organization_id',
                            '=',
                            organizationId
                        )
                        .select(['draft_invoice_id', 'email'])
                ).as('draft_invoice_paypal_billings'),
            ])
            .executeTakeFirst();

        if (!row) {
            return null;
        }

        const record: DraftInvoiceRecord = {
            id: row.id,
            status: row.status as DraftInvoiceRecord['status'],
            vat_rate: row.vat_rate,
            vat_amount: row.vat_amount,
            vat_currency: row.vat_currency,
            subtotal_amount: row.subtotal_amount,
            subtotal_currency: row.subtotal_currency,
            total_amount: row.total_amount,
            total_currency: row.total_currency,
            issue_date: row.issue_date
                ? dayjs(row.issue_date).format('YYYY-MM-DD')
                : null,
            due_date: row.due_date
                ? dayjs(row.due_date).format('YYYY-MM-DD')
                : null,
            issuer_type: row.issuer_type as DraftInvoiceRecord['issuer_type'],
            issuer_name: row.issuer_name,
            issuer_address: row.issuer_address,
            issuer_tax_id: row.issuer_tax_id,
            issuer_email: row.issuer_email,
            recipient_type:
                row.recipient_type as DraftInvoiceRecord['recipient_type'],
            recipient_name: row.recipient_name,
            recipient_address: row.recipient_address,
            recipient_tax_id: row.recipient_tax_id,
            recipient_email: row.recipient_email,
            recipient_tax_residence_country:
                row.recipient_tax_residence_country,
            line_items: row.line_items,
            draft_invoice_paypal_billings: row.draft_invoice_paypal_billings,
        };

        const entity = DraftInvoiceDataMapper.fromRecord(record);
        this.#records.set(entity, record);

        return entity;
    }

    async create(
        tx: ControlledTransaction,
        entity: DraftInvoice
    ): Promise<void> {
        const organizationId = organizationContext.getOrganizationId();
        const record = DraftInvoiceDataMapper.from(entity).toRecord();
        const now = new Date();

        const invoiceValues = {
            id: record.id,
            organization_id: organizationId,
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
        };

        const lineItemValues = record.line_items.map((item) => ({
            id: item.id,
            draft_invoice_id: record.id,
            organization_id: organizationId,
            description: item.description,
            price_amount: item.price_amount,
            price_currency: item.price_currency,
            quantity: item.quantity,
            total_amount: item.total_amount,
            total_currency: item.total_currency,
            created_at: now,
            updated_at: now,
        }));

        const paypal = record.draft_invoice_paypal_billings;
        const hasLineItems = lineItemValues.length > 0;

        if (!paypal && !hasLineItems) {
            await tx
                .insertInto('draft_invoices')
                .values(invoiceValues)
                .execute();
            return;
        }

        const withInvoice = tx.with('new_draft_invoice', (db) =>
            db.insertInto('draft_invoices').values(invoiceValues)
        );

        if (!paypal) {
            await withInvoice
                .insertInto('draft_invoice_line_items')
                .values(lineItemValues)
                .execute();
            return;
        }

        const paypalValues = {
            draft_invoice_id: record.id,
            organization_id: organizationId,
            email: paypal.email,
        };

        if (!hasLineItems) {
            await withInvoice
                .insertInto('draft_invoice_paypal_billings')
                .values(paypalValues)
                .execute();
            return;
        }

        await withInvoice
            .with('new_line_items', (db) =>
                db.insertInto('draft_invoice_line_items').values(lineItemValues)
            )
            .insertInto('draft_invoice_paypal_billings')
            .values(paypalValues)
            .execute();
    }

    async merge(
        tx: ControlledTransaction,
        entity: DraftInvoice
    ): Promise<void> {
        const organizationId = organizationContext.getOrganizationId();
        const record = DraftInvoiceDataMapper.from(entity).toRecord();
        const now = new Date();

        const originalRecord = this.#records.get(entity);

        assertNotNull(originalRecord);

        const {
            line_items: originalLineItems,
            draft_invoice_paypal_billings: originalPaypal,
            ...originalScalars
        } = originalRecord;
        const {
            line_items: newLineItems,
            draft_invoice_paypal_billings: newPaypal,
            ...newScalars
        } = record;

        const invoiceChanges = updatedDiff(
            originalScalars,
            newScalars
        ) as Partial<typeof newScalars>;

        if (Object.keys(invoiceChanges).length > 0) {
            await tx
                .updateTable('draft_invoices')
                .set({ ...invoiceChanges, updated_at: now })
                .where('id', '=', record.id)
                .where('organization_id', '=', organizationId)
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
                .deleteFrom('draft_invoice_line_items')
                .where('id', 'in', deletedLineItemIds)
                .where('organization_id', '=', organizationId)
                .execute();
        }

        const addedLineItemValues = Object.keys(addedLineItems).map((id) => {
            const item = newLineItemsById[id];
            return {
                id: item.id,
                draft_invoice_id: record.id,
                organization_id: organizationId,
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
                .insertInto('draft_invoice_line_items')
                .values(addedLineItemValues)
                .execute();
        }

        const updatedLineItemEntries = Object.entries(updatedLineItems).filter(
            ([, changes]) => Object.keys(changes).length > 0
        );

        if (updatedLineItemEntries.length > 0) {
            const items = updatedLineItemEntries.map(
                ([id]) => newLineItemsById[id]
            );

            const buildRow = (item: (typeof items)[number]) =>
                tx.selectNoFrom([
                    sql<string>`${item.id}::uuid`.as('id'),
                    sql<string>`${item.description}`.as('description'),
                    sql<string>`${item.price_amount}::numeric`.as(
                        'price_amount'
                    ),
                    sql<string>`${item.price_currency}`.as('price_currency'),
                    sql<string>`${item.quantity}::bigint`.as('quantity'),
                    sql<string>`${item.total_amount}::numeric`.as(
                        'total_amount'
                    ),
                    sql<string>`${item.total_currency}`.as('total_currency'),
                ]);

            const [first, ...rest] = items;
            const valuesQuery = rest.reduce(
                (q, item) => q.unionAll(buildRow(item)),
                buildRow(first)
            );

            await tx
                .updateTable('draft_invoice_line_items')
                .from(valuesQuery.as('v'))
                .set((eb) => ({
                    description: eb.ref('v.description'),
                    price_amount: eb.ref('v.price_amount'),
                    price_currency: eb.ref('v.price_currency'),
                    quantity: eb.ref('v.quantity'),
                    total_amount: eb.ref('v.total_amount'),
                    total_currency: eb.ref('v.total_currency'),
                    updated_at: now,
                }))
                .whereRef('draft_invoice_line_items.id', '=', 'v.id')
                .where(
                    'draft_invoice_line_items.organization_id',
                    '=',
                    organizationId
                )
                .execute();
        }

        if (originalPaypal && !newPaypal) {
            await tx
                .deleteFrom('draft_invoice_paypal_billings')
                .where('draft_invoice_id', '=', record.id)
                .where('organization_id', '=', organizationId)
                .execute();
        } else if (!originalPaypal && newPaypal) {
            await tx
                .insertInto('draft_invoice_paypal_billings')
                .values({
                    draft_invoice_id: record.id,
                    organization_id: organizationId,
                    email: newPaypal.email,
                })
                .execute();
        } else if (originalPaypal && newPaypal) {
            const paypalChanges = updatedDiff(
                originalPaypal,
                newPaypal
            ) as Partial<typeof newPaypal>;

            if (Object.keys(paypalChanges).length > 0) {
                await tx
                    .updateTable('draft_invoice_paypal_billings')
                    .set({ ...paypalChanges, updated_at: now })
                    .where('draft_invoice_id', '=', record.id)
                    .where('organization_id', '=', organizationId)
                    .execute();
            }
        }
    }
}
