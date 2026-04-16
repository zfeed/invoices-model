import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes.ts';
import { ApplicationError } from '../../../../../shared/errors/application/application.error.ts';
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

export class UpdateDraftInvoice {
    constructor(private readonly session: Session) {}

    public async execute(
        id: string,
        request: {
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
        }
    ) {
        await using unitOfWork = await this.session.begin();

        const draftInvoice = await unitOfWork
            .collection(DraftInvoice)
            .get(Id.fromString(id));

        if (!draftInvoice) {
            throw new ApplicationError({
                message: 'Draft invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        if (request.lineItems !== undefined) {
            draftInvoice.lineItems?.forEach((lineItem) => {
                draftInvoice.removeLineItem(lineItem).unwrap();
            });

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

        await unitOfWork.commit();

        return DraftInvoiceDto.fromDraftInvoice(draftInvoice);
    }
}
