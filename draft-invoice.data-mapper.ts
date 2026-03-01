import 'dotenv/config';
import { kysely, ControlledTransaction } from './database/kysely';
import { unflatten } from './src/building-blocks';
import { DraftInvoice } from './src/core/invoices/domain/draft-invoice/draft-invoice';
import { ISSUER_TYPE } from './src/core/invoices/domain/issuer/issuer';
import { RECIPIENT_TYPE } from './src/core/invoices/domain/recipient/recipient';

export class DraftInvoiceMapper {
    select(id: string, tx: ControlledTransaction) {
        return tx
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

    toPlain(records: Awaited<ReturnType<DraftInvoiceMapper['select']>>) {
        const record = unflatten(records, {
            lineItems: {
                prefix: 'draft_invoice_line_item_',
                type: 'many',
                id: 'id',
            },
            paypalBilling: {
                prefix: 'draft_invoice_paypal_billing_',
                type: 'one',
            },
        })!;

        const hasLineItems = record.lineItems.length > 0;

        return {
            id: record.id,
            status: record.status as string,
            lineItems: hasLineItems
                ? {
                      items: record.lineItems.map((item) => ({
                          description: item.description!,
                          price: {
                              amount: item.price_amount!,
                              currency: item.price_currency!,
                          },
                          quantity: String(item.quantity),
                          total: {
                              amount: item.total_amount!,
                              currency: item.total_currency!,
                          },
                      })),
                      subtotal: {
                          amount: record.subtotal_amount!,
                          currency: record.subtotal_currency!,
                      },
                  }
                : null,
            total: record.total_amount
                ? {
                      amount: record.total_amount,
                      currency: record.total_currency!,
                  }
                : null,
            vatRate: record.vat_rate,
            vatAmount: record.vat_amount
                ? { amount: record.vat_amount, currency: record.vat_currency! }
                : null,
            issueDate: record.issue_date
                ? record.issue_date.toISOString().split('T')[0]
                : null,
            dueDate: record.due_date
                ? record.due_date.toISOString().split('T')[0]
                : null,
            issuer: record.issuer_type
                ? {
                      type: record.issuer_type as ISSUER_TYPE,
                      name: record.issuer_name!,
                      address: record.issuer_address!,
                      taxId: record.issuer_tax_id!,
                      email: record.issuer_email!,
                  }
                : null,
            recipient: record.paypalBilling
                ? {
                      type: record.recipient_type! as RECIPIENT_TYPE,
                      name: record.recipient_name!,
                      address: record.recipient_address!,
                      taxId: record.recipient_tax_id!,
                      email: record.recipient_email!,
                      taxResidenceCountry:
                          record.recipient_tax_residence_country!,
                      billing: {
                          type: 'PAYPAL' as const,
                          data: {
                              email: record.paypalBilling.email as string,
                          },
                      },
                  }
                : null,
        };
    }

    toDomain(plain: ReturnType<DraftInvoiceMapper['toPlain']>) {
        return DraftInvoice.fromPlain(plain);
    }
}
