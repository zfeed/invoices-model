import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes.ts';
import { ApplicationError } from '../../../../../shared/errors/application/application.error.ts';
import { Kysely } from '../../../../../../database/kysely.ts';
import { InvoiceDto } from './invoice.dto.ts';

export class GetInvoice {
    constructor(private readonly kysely: Kysely) {}

    public async execute(id: string): Promise<InvoiceDto> {
        const rows = await this.kysely
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
                'invoice_line_items.id as line_item_id',
                'invoice_line_items.description as line_item_description',
                'invoice_line_items.price_amount as line_item_price_amount',
                'invoice_line_items.price_currency as line_item_price_currency',
                'invoice_line_items.quantity as line_item_quantity',
                'invoice_line_items.total_amount as line_item_total_amount',
                'invoice_line_items.total_currency as line_item_total_currency',
                'invoice_paypal_billings.email as paypal_billing_email',
            ])
            .execute();

        if (rows.length === 0) {
            throw new ApplicationError({
                message: 'Invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        return InvoiceDto.fromRows(rows);
    }
}
