import { LineItem } from '../line-item/line-item';
import { Money } from '../money/money/money';
import { Vat } from '../vat/vat';
import { DraftInvoice } from './draft-invoice';
import { Issuer, ISSUER_TYPE } from '../issuer/issuer';
import { Recipient, RECIPIENT_TYPE } from '../recipient/recipient';
import { Paypal } from '../recipient/billing/paypal';
import { CalendarDate } from '../calendar-date/calendar-date';

describe('DraftInvoice', () => {
    it('should create a draft invoice instance with missing data', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        expect(draftInvoice.total).toBeNull();
        expect(draftInvoice.vatRate).toBeNull();
        expect(draftInvoice.vatAmount).toBeNull();
        expect(draftInvoice.lineItems).toBeNull();
        expect(draftInvoice.issueDate).toBeNull();
        expect(draftInvoice.dueDate).toBeNull();
        expect(draftInvoice.issuer).toBeNull();
        expect(draftInvoice.recipient).toBeNull();
    });

    it('should not create an invoice from draft invoice if draft is incomplete', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const result = draftInvoice.toInvoice();

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '8000',
            })
        );
    });

    it('should add line item to draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        draftInvoice.addLineItem(lineItem1)?.unwrap();

        expect(draftInvoice.lineItems?.length).toBe(1);
        expect(
            draftInvoice.lineItems?.find((lineItem) =>
                lineItem.equals(lineItem1)
            )
        ).toBeDefined();
        expect(
            draftInvoice.total?.equals(Money.create('100', 'USD').unwrap())
        ).toBe(true);
        expect(draftInvoice.vatAmount).toBeNull();
    });

    it('should remove line item from draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        const lineItem2 = LineItem.create({
            description: 'Item 2',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '1',
        }).unwrap();

        draftInvoice.addLineItem(lineItem1)?.unwrap();
        draftInvoice.addLineItem(lineItem2)?.unwrap();
        draftInvoice.removeLineItem(lineItem1)?.unwrap();

        expect(draftInvoice.lineItems?.length).toBe(1);
        expect(
            draftInvoice.lineItems?.find((lineItem) =>
                lineItem.equals(lineItem1)
            )
        ).toBeUndefined();
        expect(
            draftInvoice.total?.equals(Money.create('100', 'USD').unwrap())
        ).toBe(true);
    });

    it('should add not apply vat to invoice with no line items', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const vat = Vat.create('20').unwrap();

        const result = draftInvoice.applyVat(vat);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '8001',
            })
        );
    });

    it('should apply vat to draft invoice with line items', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        draftInvoice.addLineItem(lineItem1).unwrap();

        const vat = Vat.create('20').unwrap();

        draftInvoice.applyVat(vat).unwrap();

        expect(draftInvoice.vatRate?.equals(vat)).toBe(true);
        expect(
            draftInvoice.vatAmount?.equals(Money.create('20', 'USD').unwrap())
        ).toBe(true);
        expect(
            draftInvoice.total?.equals(Money.create('120', 'USD').unwrap())
        ).toBe(true);
    });

    it('should add issuer to draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: 'Company Inc.',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
        }).unwrap();

        draftInvoice.addIssuer(issuer).unwrap();

        expect(draftInvoice.issuer).toBeDefined();
        expect(draftInvoice.issuer?.equals(issuer)).toBe(true);
    });

    it('should add recipient to draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const recipientBilling = Paypal.create({
            email: 'customer@example.com',
        }).unwrap();

        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'Jane Smith',
            address: '456 Another St, City, Country',
            taxId: 'TAX654321',
            email: 'jane.smith@example.com',
            taxResidenceCountry: 'US',
            billing: recipientBilling,
        }).unwrap();

        draftInvoice.addRecipient(recipient).unwrap();

        expect(draftInvoice.recipient).toBeDefined();
        expect(draftInvoice.recipient?.equals(recipient)).toBe(true);
    });

    it('should add due date to draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const dueDate = CalendarDate.create('2023-01-01').unwrap();

        draftInvoice.addDueDate(dueDate).unwrap();

        expect(draftInvoice.dueDate).toBeDefined();
        expect(draftInvoice.dueDate?.equals(dueDate)).toBe(true);
    });

    it('should add issue date to draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const issueDate = CalendarDate.create('2023-01-01').unwrap();

        draftInvoice.addIssueDate(issueDate).unwrap();

        expect(draftInvoice.issueDate).toBeDefined();
        expect(draftInvoice.issueDate?.equals(issueDate)).toBe(true);
    });
});
