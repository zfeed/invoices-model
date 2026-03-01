import 'dotenv/config';
import { kysely } from './database/kysely';
import { unflatten } from './src/building-blocks';
import { DraftInvoice } from './src/core/invoices/domain/draft-invoice/draft-invoice';
import { ISSUER_TYPE } from './src/core/invoices/domain/issuer/issuer';
import { RECIPIENT_TYPE } from './src/core/invoices/domain/recipient/recipient';
import { DraftInvoiceMapper } from './draft-invoice.data-mapper';

async function select(id: string) {
    const tx = await kysely.startTransaction().execute();

    const draftInvoiceRecords = await tx
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

    await tx.commit().execute();

    return draftInvoiceRecords;
}

export async function selectDraftInvoice(id: string) {
    const draftInvoiceDataMapper = new DraftInvoiceMapper();

    const tx = await kysely.startTransaction().execute();

    const records = await draftInvoiceDataMapper.select(id, tx);

    const plain = draftInvoiceDataMapper.toPlain(records);

    const draftInv = DraftInvoice.fromPlain(plain);

    return draftInv;
}
