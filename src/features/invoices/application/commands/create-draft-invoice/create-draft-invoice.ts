import { CalendarDate } from '../../../domain/calendar-date/calendar-date.ts';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice.ts';
import { Id } from '../../../domain/id/id.ts';
import { Issuer, ISSUER_TYPE } from '../../../domain/issuer/issuer.ts';
import { LineItem } from '../../../domain/line-item/line-item.ts';
import { Paypal } from '../../../domain/billing/paypal/paypal.ts';
import { Recipient, RECIPIENT_TYPE } from '../../../domain/recipient/recipient.ts';
import { VatRate } from '../../../domain/vat-rate/vat-rate.ts';
import { Session } from '../../../../../shared/unit-of-work/unit-of-work.ts';
import { DraftInvoiceDto } from '../../queries/get-draft-invoice/draft-invoice.dto.ts';

export class CreateDraftInvoice {
    constructor(private readonly session: Session) {}

    public async execute(request: {
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
            billing: {
                type: 'PAYPAL';
                email: string;
            };
        };
    }) {
        await using unitOfWork = await this.session.begin();

        const draftInvoice = DraftInvoice.create(Id.create().unwrap()).unwrap();

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
            const billing = Paypal.create(request.recipient.billing).unwrap();

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

        await unitOfWork.collection(DraftInvoice).add(draftInvoice);

        await unitOfWork.commit();

        return DraftInvoiceDto.fromDraftInvoice(draftInvoice);
    }
}
