import { CalendarDate } from '../../invoices/domain/calendar-date/calendar-date';
import { DraftInvoice } from '../../invoices/domain/draft-invoice/draft-invoice';
import { Issuer } from '../../invoices/domain/issuer/issuer';
import { LineItem } from '../../invoices/domain/line-item/line-item';
import { Paypal } from '../../invoices/domain/recipient/billing/paypal';
import { Wire } from '../../invoices/domain/recipient/billing/wire';
import { Recipient } from '../../invoices/domain/recipient/recipient';
import { VatRate } from '../../invoices/domain/vat-rate/vat-rate';

export type DraftInvoicePlain = ReturnType<DraftInvoice['toPlain']>;

export const DraftInvoiceMapper = {
    toPlain(draftInvoice: DraftInvoice): DraftInvoicePlain {
        return draftInvoice.toPlain();
    },

    toDomain(plain: DraftInvoicePlain): DraftInvoice {
        const draft = DraftInvoice.create().unwrap();

        if (plain.lineItems) {
            for (const item of plain.lineItems.items) {
                draft.addLineItem(
                    LineItem.create({
                        description: item.description,
                        price: item.price,
                        quantity: item.quantity,
                    }).unwrap()
                );
            }
        }

        if (plain.vatRate) {
            draft.applyVat(VatRate.create(plain.vatRate).unwrap());
        }

        if (plain.issuer) {
            draft.addIssuer(Issuer.create(plain.issuer).unwrap());
        }

        if (plain.recipient) {
            const billing =
                plain.recipient.billing.type === 'PAYPAL'
                    ? Paypal.create({ email: plain.recipient.billing.data.email }).unwrap()
                    : Wire.create(plain.recipient.billing.data).unwrap();
            draft.addRecipient(
                Recipient.create({ ...plain.recipient, billing }).unwrap()
            );
        }

        if (plain.issueDate) {
            draft.addIssueDate(CalendarDate.create(plain.issueDate).unwrap());
        }

        if (plain.dueDate) {
            draft.addDueDate(CalendarDate.create(plain.dueDate).unwrap());
        }

        return draft;
    },
};
