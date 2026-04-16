import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice.ts';
import { InvoiceLineItemDto } from '../get-invoice/invoice.dto.ts';

export type DraftInvoiceIssuerDto = {
    type: string;
    name: string;
    address: string;
    taxId: string;
    email: string;
};

export type DraftInvoiceRecipientDto = {
    type: string;
    name: string;
    address: string;
    taxId: string;
    email: string;
    taxResidenceCountry: string;
    paypalEmail: string | null;
};

export class DraftInvoiceDto {
    constructor(
        public readonly id: string,
        public readonly status: string,
        public readonly subtotalAmount: string | null,
        public readonly subtotalCurrency: string | null,
        public readonly totalAmount: string | null,
        public readonly totalCurrency: string | null,
        public readonly vatRate: string | null,
        public readonly vatAmount: string | null,
        public readonly vatCurrency: string | null,
        public readonly issueDate: string | null,
        public readonly dueDate: string | null,
        public readonly issuer: DraftInvoiceIssuerDto | null,
        public readonly recipient: DraftInvoiceRecipientDto | null,
        public readonly lineItems: InvoiceLineItemDto[] | null
    ) {}

    static fromDraftInvoice(draftInvoice: DraftInvoice): DraftInvoiceDto {
        const plain = draftInvoice.toPlain();

        return new DraftInvoiceDto(
            plain.id,
            plain.status,
            plain.lineItems?.subtotal.amount ?? null,
            plain.lineItems?.subtotal.currency ?? null,
            plain.total?.amount ?? null,
            plain.total?.currency ?? null,
            plain.vatRate,
            plain.vatAmount?.amount ?? null,
            plain.vatAmount?.currency ?? null,
            plain.issueDate,
            plain.dueDate,
            plain.issuer
                ? {
                      type: plain.issuer.type,
                      name: plain.issuer.name,
                      address: plain.issuer.address,
                      taxId: plain.issuer.taxId,
                      email: plain.issuer.email,
                  }
                : null,
            plain.recipient
                ? {
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
                  }
                : null,
            plain.lineItems
                ? plain.lineItems.items.map((item) => ({
                      id: item.id,
                      description: item.description,
                      priceAmount: item.price.amount,
                      priceCurrency: item.price.currency,
                      quantity: item.quantity,
                      totalAmount: item.total.amount,
                      totalCurrency: item.total.currency,
                  }))
                : null
        );
    }
}
