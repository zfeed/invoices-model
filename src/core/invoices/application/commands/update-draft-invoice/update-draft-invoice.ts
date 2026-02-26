import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../../building-blocks/errors/application/application.error';
import { CalendarDate } from '../../../domain/calendar-date/calendar-date';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice';
import { Id } from '../../../domain/id/id';
import { Issuer, ISSUER_TYPE } from '../../../domain/issuer/issuer';
import { LineItem } from '../../../domain/line-item/line-item';
import { Paypal } from '../../../domain/billing/paypal/paypal';
import { Recipient, RECIPIENT_TYPE } from '../../../domain/recipient/recipient';
import { VatRate } from '../../../domain/vat-rate/vat-rate';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { Session } from '../../../../shared/unit-of-work/unit-of-work.interface';

export class UpdateDraftInvoice {
    constructor(
        private readonly session: Session,
        private readonly domainEvents: DomainEvents
    ) {}

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

        await this.domainEvents.publishEvents(draftInvoice);

        return draftInvoice.toPlain();
    }
}
