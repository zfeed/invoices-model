import dayjs from 'dayjs';
import { Kysely } from '../../../../../../database/kysely';
import { Invoice } from '../../../domain/invoice/invoice';

export type InvoiceQueryRow = {
    id: string;
    status: string;
    subtotal_amount: string;
    subtotal_currency: string;
    total_amount: string;
    total_currency: string;
    vat_rate: string | null;
    vat_amount: string | null;
    vat_currency: string | null;
    issue_date: Date | string;
    due_date: Date | string;
    issuer_type: string;
    issuer_name: string;
    issuer_address: string;
    issuer_tax_id: string;
    issuer_email: string;
    recipient_type: string;
    recipient_name: string;
    recipient_address: string;
    recipient_tax_id: string;
    recipient_email: string;
    recipient_tax_residence_country: string;
    line_item_id: string | null;
    line_item_description: string | null;
    line_item_price_amount: string | null;
    line_item_price_currency: string | null;
    line_item_quantity: string | null;
    line_item_total_amount: string | null;
    line_item_total_currency: string | null;
    paypal_billing_email: string | null;
};

export type InvoiceLineItemDto = {
    id: string;
    description: string;
    priceAmount: string;
    priceCurrency: string;
    quantity: string;
    totalAmount: string;
    totalCurrency: string;
};

export class InvoiceDto {
    constructor(
        public readonly id: string,
        public readonly status: string,
        public readonly subtotalAmount: string,
        public readonly subtotalCurrency: string,
        public readonly totalAmount: string,
        public readonly totalCurrency: string,
        public readonly vatRate: string | null,
        public readonly vatAmount: string | null,
        public readonly vatCurrency: string | null,
        public readonly issueDate: string,
        public readonly dueDate: string,
        public readonly issuer: {
            type: string;
            name: string;
            address: string;
            taxId: string;
            email: string;
        },
        public readonly recipient: {
            type: string;
            name: string;
            address: string;
            taxId: string;
            email: string;
            taxResidenceCountry: string;
            paypalEmail: string | null;
        },
        public readonly lineItems: InvoiceLineItemDto[]
    ) {}

    static fromInvoice(invoice: Invoice): InvoiceDto {
        const plain = invoice.toPlain();

        return new InvoiceDto(
            plain.id,
            plain.status,
            plain.lineItems.subtotal.amount,
            plain.lineItems.subtotal.currency,
            plain.total.amount,
            plain.total.currency,
            plain.vatRate,
            plain.vatAmount?.amount ?? null,
            plain.vatAmount?.currency ?? null,
            plain.issueDate,
            plain.dueDate,
            {
                type: plain.issuer.type,
                name: plain.issuer.name,
                address: plain.issuer.address,
                taxId: plain.issuer.taxId,
                email: plain.issuer.email,
            },
            {
                type: plain.recipient.type,
                name: plain.recipient.name,
                address: plain.recipient.address,
                taxId: plain.recipient.taxId,
                email: plain.recipient.email,
                taxResidenceCountry: plain.recipient.taxResidenceCountry,
                paypalEmail:
                    plain.recipient.billing.type === 'PAYPAL'
                        ? plain.recipient.billing.data.email
                        : null,
            },
            plain.lineItems.items.map((item) => ({
                id: item.id,
                description: item.description,
                priceAmount: item.price.amount,
                priceCurrency: item.price.currency,
                quantity: item.quantity,
                totalAmount: item.total.amount,
                totalCurrency: item.total.currency,
            }))
        );
    }

    static fromRows(rows: InvoiceQueryRow[]): InvoiceDto {
        const head = rows[0];

        const lineItems = rows
            .filter((r) => r.line_item_id !== null)
            .map((r) => ({
                id: r.line_item_id!,
                description: r.line_item_description!,
                priceAmount: r.line_item_price_amount!,
                priceCurrency: r.line_item_price_currency!,
                quantity: r.line_item_quantity!,
                totalAmount: r.line_item_total_amount!,
                totalCurrency: r.line_item_total_currency!,
            }));

        return new InvoiceDto(
            head.id,
            head.status,
            head.subtotal_amount,
            head.subtotal_currency,
            head.total_amount,
            head.total_currency,
            head.vat_rate,
            head.vat_amount,
            head.vat_currency,
            dayjs(head.issue_date).format('YYYY-MM-DD'),
            dayjs(head.due_date).format('YYYY-MM-DD'),
            {
                type: head.issuer_type,
                name: head.issuer_name,
                address: head.issuer_address,
                taxId: head.issuer_tax_id,
                email: head.issuer_email,
            },
            {
                type: head.recipient_type,
                name: head.recipient_name,
                address: head.recipient_address,
                taxId: head.recipient_tax_id,
                email: head.recipient_email,
                taxResidenceCountry: head.recipient_tax_residence_country,
                paypalEmail: head.paypal_billing_email,
            },
            lineItems
        );
    }
}
