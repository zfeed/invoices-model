import { CalendarDate } from '../../../domain/calendar-date/calendar-date';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice';
import { Issuer, ISSUER_TYPE } from '../../../domain/issuer/issuer';
import { LineItem } from '../../../domain/line-item/line-item';
import { Paypal } from '../../../domain/recipient/billing/paypal';
import { Wire } from '../../../domain/recipient/billing/wire';
import { Recipient, RECIPIENT_TYPE } from '../../../domain/recipient/recipient';
import { VatRate } from '../../../domain/vat-rate/vat-rate';

export class CalculateDraftInvoice {
    public execute(request: {
        lineItems?: {
            description: string;
            price: { amount: string; currency: string };
            quantity: string;
        }[];
        vatRate?: string;
        issueDate?: string;
        dueDate?: string;
        issuer?: {
            type: ISSUER_TYPE;
            name: string;
            address: string;
            taxId: string;
            email: string;
        };
        recipient?: {
            type: RECIPIENT_TYPE;
            name: string;
            address: string;
            taxId: string;
            email: string;
            taxResidenceCountry: string;
            billing:
                | {
                      type: 'PAYPAL';
                      email: string;
                  }
                | {
                      type: 'WIRE';
                      swift: string;
                      accountNumber: string;
                      accountHolderName: string;
                      bankName: string;
                      bankAddress: string;
                      bankCountry: string;
                  };
        };
    }) {
        const draftInvoice = DraftInvoice.create().unwrap();

        if (request.lineItems) {
            request.lineItems
                .map((lineItem) => LineItem.create(lineItem).unwrap())
                .forEach((lineItem) =>
                    draftInvoice.addLineItem(lineItem).unwrap()
                );
        }

        if (request.vatRate) {
            const vatRate = VatRate.create(request.vatRate).unwrap();
            draftInvoice.applyVat(vatRate).unwrap();
        }

        if (request.issueDate) {
            const issueDate = CalendarDate.create(request.issueDate).unwrap();
            draftInvoice.addIssueDate(issueDate).unwrap();
        }

        if (request.dueDate) {
            const dueDate = CalendarDate.create(request.dueDate).unwrap();
            draftInvoice.addDueDate(dueDate).unwrap();
        }

        if (request.issuer) {
            const issuer = Issuer.create(request.issuer).unwrap();
            draftInvoice.addIssuer(issuer).unwrap();
        }

        if (request.recipient) {
            const billing =
                request.recipient.billing.type === 'PAYPAL'
                    ? Paypal.create(request.recipient.billing).unwrap()
                    : Wire.create(request.recipient.billing).unwrap();

            const recipient = Recipient.create({
                type: request.recipient.type,
                name: request.recipient.name,
                address: request.recipient.address,
                taxId: request.recipient.taxId,
                email: request.recipient.email,
                taxResidenceCountry: request.recipient.taxResidenceCountry,
                billing,
            }).unwrap();

            draftInvoice.addRecipient(recipient).unwrap();
        }

        return draftInvoice.toPlain();
    }
}
