import { Money } from "../money/money/money";
import { Invoice } from "./invoice";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { IssueDate } from "../calendar-date/calendar-date";
import { Recipient, RECIPIENT_TYPE } from "../recipient/recipient";
import { Paypal } from "../recipient/billing/paypal";
import { Issuer, ISSUER_TYPE } from '../issuer/issuer';
import { LineItems } from "../line-items/line-items";

describe("Invoice", () => {    
    it("should create an invoice instance", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "30",
                currency: "USD"
            },
            quantity: '1'
        }).unwrap();
        const issueDate = IssueDate.create("2023-01-01").unwrap();
        const dueDate = IssueDate.create("2028-01-01").unwrap();
        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: "Company Inc.",
            address: "123 Main St, City, Country",
            taxId: "TAX123456",
            email: 'info@company.com',
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: issueDate,
            dueDate: dueDate,
            lineItems: LineItems.create({ items: [lineItem1, lineItem2] }).unwrap(),
            issuer: issuer,
            recipient: recipient
        }).unwrap();

        expect(invoice.total.equals(Money.create("130", "USD").unwrap())).toBe(true);
        expect(invoice.lineItems.subtotal.equals(Money.create("130", "USD").unwrap())).toBe(true);
        expect(invoice.vatRate.equals(Vat.create("0"))).toBe(true);
        expect(invoice.vatAmount.equals(Money.create("0", "USD").unwrap())).toBe(true);
        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.issueDate.equals(issueDate)).toBe(true);
        expect(invoice.dueDate.equals(dueDate)).toBe(true);
        expect(invoice.issuer.equals(issuer)).toBe(true);
        expect(invoice.recipient.type).toBe('INDIVIDUAL');
    });

    it("should apply VAT to invoice total", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "30",
                currency: "USD"
            },
            quantity: '1'
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1, lineItem2] }).unwrap(),
            issuer: Issuer.create({
                type: ISSUER_TYPE.COMPANY,
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap(),
            recipient: recipient
        }).unwrap();
        const vat = Vat.create("20");

        const result = invoice.applyVat(vat);

        expect(invoice.total.equals(Money.create("156", "USD").unwrap())).toBe(true);
        expect(invoice.lineItems.subtotal.equals(Money.create("130", "USD").unwrap())).toBe(true);
        expect(invoice.vatRate.equals(Vat.create("20"))).toBe(true);
        expect(invoice.vatAmount.equals(Money.create("26", "USD").unwrap())).toBe(true);
        expect(result.isOk()).toBe(true);
    });

    it("should reapply VAT to invoice total", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "30",
                currency: "USD"
            },
            quantity: '1'
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1, lineItem2] }).unwrap(),
            issuer: Issuer.create({
                type: ISSUER_TYPE.COMPANY,
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap(),
            recipient: recipient
        }).unwrap();
        const vat1 = Vat.create("20");
        const vat2 = Vat.create("10");

        invoice.applyVat(vat1);
        invoice.applyVat(vat2);

        expect(invoice.total.equals(Money.create("143", "USD").unwrap())).toBe(true);
        expect(invoice.lineItems.subtotal.equals(Money.create("130", "USD").unwrap())).toBe(true);
        expect(invoice.vatRate.equals(Vat.create("10"))).toBe(true);
        expect(invoice.vatAmount.equals(Money.create("13", "USD").unwrap())).toBe(true);
    });

    it("should add a line item", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        
        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1] }).unwrap(),
            issuer: Issuer.create({
                type: ISSUER_TYPE.COMPANY,
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap(),
            recipient: recipient
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "30",
                currency: "USD"
            },
            quantity: '4'
        }).unwrap();

        invoice.addLineItem(lineItem2);

        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.lineItems.subtotal.equals(Money.create("220", "USD").unwrap())).toBe(true);
    });

    it("should add respect applied vat when a line item added", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1] }).unwrap(),
            issuer: issuer,
            recipient: recipient
        }).unwrap();

        invoice.applyVat(Vat.create("10"));

        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "30",
                currency: "USD"
            },
            quantity: '4'
        }).unwrap();

        invoice.addLineItem(lineItem2).unwrap();

        expect(invoice.lineItems.subtotal.equals(Money.create("220", "USD").unwrap())).toBe(true);
        expect(invoice.total.equals(Money.create("242", "USD").unwrap())).toBe(true);
    });

    it("should not add a duplicate line item", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();

        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1] }).unwrap(),
            issuer: issuer,
            recipient: recipient
        }).unwrap();

        const result = invoice.addLineItem(lineItem1);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1002',
            })
        );
    });

    it("should remove a line item", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "40",
                currency: "USD"
            },
            quantity: '5'
        }).unwrap();

        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1, lineItem2] }).unwrap(),
            issuer: issuer,
            recipient: recipient
        }).unwrap();

        const removedItem = invoice.removeLineItem(
            LineItem.create({
                description: "Item 1",
                price: {
                amount: "50",
                currency: "USD"
            },
                quantity: '2'
            }).unwrap()
        ).unwrap();

        expect(removedItem).toBeDefined();
        expect(removedItem?.equals(lineItem1)).toBe(true);
        expect(invoice.lineItems).toHaveLength(1);
        expect(invoice.lineItems.subtotal.equals(Money.create("200", "USD").unwrap())).toBe(true);
        expect(
            invoice.lineItems.contains(lineItem2)
        ).toBeTruthy();
    });

    it("should change total when a line item is removed", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "40",
                currency: "USD"
            },
            quantity: '5'
        }).unwrap();

        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1, lineItem2] }).unwrap(),
            issuer: issuer,
            recipient: recipient
        }).unwrap();

        invoice.removeLineItem(
            LineItem.create({
                description: "Item 1",
                price: {
                amount: "50",
                currency: "USD"
            },
                quantity: '2'
            }).unwrap()
        );

        expect(invoice.total.equals(Money.create("200", "USD").unwrap())).toBe(true);
    });

    it("should change total according to applied vat when a line item is removed", () => {
        const lineItem1 = LineItem.create({
            description: "Item 1",
            price: {
                amount: "50",
                currency: "USD"
            },
            quantity: '2'
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: "Item 2",
            price: {
                amount: "40",
                currency: "USD"
            },
            quantity: '5'
        }).unwrap();

        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const recipientBilling = Paypal.create({ email: "customer@example.com" }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: "Jane Smith",
            address: "456 Another St, City, Country",
            taxId: "TAX654321",
            email: 'jane.smith@example.com',
            taxResidenceCountry: "US",
            billing: recipientBilling
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: LineItems.create({ items: [lineItem1, lineItem2] }).unwrap(),
            issuer: issuer,
            recipient: recipient
        }).unwrap();

        invoice.applyVat(Vat.create("10"));

        invoice.removeLineItem(
            LineItem.create({
                description: "Item 1",
                price: {
                amount: "50",
                currency: "USD"
            },
                quantity:'2'
            }).unwrap()
        );

        expect(invoice.total.equals(Money.create("220", "USD").unwrap())).toBe(true);
    });
});
