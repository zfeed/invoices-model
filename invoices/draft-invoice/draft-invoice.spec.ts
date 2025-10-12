import { CalendarDate } from '../calendar-date/calendar-date';
import { Issuer, ISSUER_TYPE } from '../issuer/issuer';
import { LineItem } from '../line-item/line-item';
import { Money } from '../money/money/money';
import { Paypal } from '../recipient/billing/paypal';
import { Recipient, RECIPIENT_TYPE } from '../recipient/recipient';
import { VatRate } from '../vat-rate/vat-rate';
import { DraftInvoice } from './draft-invoice';

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
        expect(draftInvoice.events[0]).toEqual(
            expect.objectContaining({
                name: 'draft-invoice.created',
                data: {
                    id: expect.any(String),
                    lineItems: null,
                    total: null,
                    vatRate: null,
                    vatAmount: null,
                    issueDate: null,
                    dueDate: null,
                    issuer: null,
                    recipient: null,
                },
            })
        );
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

        const vat = VatRate.create('20').unwrap();

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

        const vat = VatRate.create('20').unwrap();

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

    it('should mark draft invoice as valid when all fields are filled in', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const issueDate = CalendarDate.create('2023-01-01').unwrap();

        const dueDate = CalendarDate.create('2023-01-01').unwrap();
        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: 'Company Inc.',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
        }).unwrap();

        const recipientBilling = Paypal.create({
            email: 'customer@example.com',
        }).unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        const vat = VatRate.create('20').unwrap();

        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'Jane Smith',
            address: '456 Another St, City, Country',
            taxId: 'TAX654321',
            email: 'jane.smith@example.com',
            taxResidenceCountry: 'US',
            billing: recipientBilling,
        }).unwrap();

        draftInvoice.addDueDate(dueDate).unwrap();
        draftInvoice.addRecipient(recipient).unwrap();
        draftInvoice.addIssuer(issuer).unwrap();
        draftInvoice.addLineItem(lineItem1).unwrap();
        draftInvoice.applyVat(vat).unwrap();
        draftInvoice.addDueDate(dueDate).unwrap();
        draftInvoice.addIssueDate(issueDate).unwrap();

        expect(draftInvoice.isValid()).toBe(true);
    });

    it('should create invoice from draft valid invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const issueDate = CalendarDate.create('2023-01-01').unwrap();

        const dueDate = CalendarDate.create('2023-01-01').unwrap();
        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: 'Company Inc.',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
        }).unwrap();

        const recipientBilling = Paypal.create({
            email: 'customer@example.com',
        }).unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        const vat = VatRate.create('20').unwrap();

        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'Jane Smith',
            address: '456 Another St, City, Country',
            taxId: 'TAX654321',
            email: 'jane.smith@example.com',
            taxResidenceCountry: 'US',
            billing: recipientBilling,
        }).unwrap();

        draftInvoice.addDueDate(dueDate).unwrap();
        draftInvoice.addRecipient(recipient).unwrap();
        draftInvoice.addIssuer(issuer).unwrap();
        draftInvoice.addLineItem(lineItem1).unwrap();
        draftInvoice.applyVat(vat).unwrap();
        draftInvoice.addDueDate(dueDate).unwrap();
        draftInvoice.addIssueDate(issueDate).unwrap();

        const invoice = draftInvoice.toInvoice().unwrap();

        expect(invoice.dueDate.equals(draftInvoice.dueDate!));
        expect(invoice.issueDate.equals(draftInvoice.issueDate!));
        expect(invoice.issuer.equals(draftInvoice.issuer!));
        expect(invoice.recipient.equals(draftInvoice.recipient!));
        expect(invoice.vatRate!.equals(draftInvoice.vatRate!));
        expect(invoice.lineItems.equals(draftInvoice.lineItems!));
        expect(invoice.vatAmount!.equals(draftInvoice.vatAmount!));
        expect(invoice.total.equals(draftInvoice.total!));
    });

    it('should not allow adding due date when issue date is already set and due date is before issue date', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const issueDate = CalendarDate.create('2028-02-01').unwrap();
        const dueDate = CalendarDate.create('2023-01-01').unwrap();

        // First add issue date
        const addIssueDateResult = draftInvoice.addIssueDate(issueDate);
        expect(addIssueDateResult.isOk()).toBe(true);

        // Then try to add due date that's before issue date
        const addDueDateResult = draftInvoice.addDueDate(dueDate);
        expect(addDueDateResult.isError()).toBe(true);
        expect(addDueDateResult.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10000',
            })
        );

        // Due date should not be set
        expect(draftInvoice.dueDate).toBeNull();
    });

    it('should not allow adding issue date when due date is already set and issue date is after due date', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const issueDate = CalendarDate.create('2028-02-01').unwrap();
        const dueDate = CalendarDate.create('2023-01-01').unwrap();

        // First add due date
        const addDueDateResult = draftInvoice.addDueDate(dueDate);
        expect(addDueDateResult.isOk()).toBe(true);

        // Then try to add issue date that's after due date
        const addIssueDateResult = draftInvoice.addIssueDate(issueDate);
        expect(addIssueDateResult.isError()).toBe(true);
        expect(addIssueDateResult.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10000',
            })
        );

        // Issue date should not be set
        expect(draftInvoice.issueDate).toBeNull();
    });

    it('should allow adding dates when they are equal', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const date = CalendarDate.create('2024-01-01').unwrap();

        // Add issue date first
        const addIssueDateResult = draftInvoice.addIssueDate(date);
        expect(addIssueDateResult.isOk()).toBe(true);

        // Add same date as due date
        const addDueDateResult = draftInvoice.addDueDate(date);
        expect(addDueDateResult.isOk()).toBe(true);

        expect(draftInvoice.issueDate?.equals(date)).toBe(true);
        expect(draftInvoice.dueDate?.equals(date)).toBe(true);
    });
});
