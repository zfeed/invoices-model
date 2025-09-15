import { Money } from "../money/money/money";
import { Invoice } from "./invoice";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { IssueDate } from "../calendar-date/calendar-date";
import { Issuer } from '../issuer/issuer';

describe("Invoice", () => {
    it("should create an Invoice instance", () => {
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
            name: "Company Inc.",
            address: "123 Main St, City, Country",
            taxId: "TAX123456",
            email: 'info@company.com',
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: issueDate,
            dueDate: dueDate,
            lineItems: [lineItem1, lineItem2],
            issuer: issuer
        }).unwrap();

        expect(invoice.total.equals(Money.create("130", "USD").unwrap())).toBe(true);
        expect(invoice.vat.equals(Vat.create("0"))).toBe(true);
        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.issueDate.equals(issueDate)).toBe(true);
        expect(invoice.dueDate.equals(dueDate)).toBe(true);
        expect(issuer.equals(invoice.issuer)).toBe(true);
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

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
            issuer: Issuer.create({
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap()
        }).unwrap();
        const vat = Vat.create("20");

        const result = invoice.applyVat(vat);

        expect(invoice.total.equals(Money.create("156", "USD").unwrap())).toBe(true);
        expect(invoice.vat.equals(Vat.create("20"))).toBe(true);
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

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
            issuer: Issuer.create({
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap()
        }).unwrap();
        const vat1 = Vat.create("20");
        const vat2 = Vat.create("10");

        invoice.applyVat(vat1);
        invoice.applyVat(vat2);

        expect(invoice.total.equals(Money.create("143", "USD").unwrap())).toBe(true);
        expect(invoice.vat.equals(Vat.create("10"))).toBe(true);
    });

    it("should not create an invoice with no line items", () => {
        const result = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [],
            issuer: Issuer.create({
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap()
        });

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1000',
            })
        );
    });

    it("should not create an invoice with line items that have different currency", () => {
        const result = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [
                LineItem.create({
                    description: "Item 1",
                    price: {
                amount: "50",
                currency: "USD"
            },
                    quantity: '2'
                }).unwrap(),
                LineItem.create({
                    description: "Item 2",
                    price: {
                amount: "30",
                currency: "EUR"
            },
                    quantity: '1'
                }).unwrap(),
            ],
            issuer: Issuer.create({
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap()
        });

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1001',
            })
        );
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
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1],
            issuer: Issuer.create({
                name: "Test Company",
                address: "123 Test St",
                taxId: "TEST123",
                email: "test@company.com"
            }).unwrap()
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
        expect(invoice.total.equals(Money.create("220", "USD").unwrap())).toBe(true);
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
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1],
            issuer: issuer
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

        invoice.addLineItem(lineItem2);

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
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1],
            issuer: issuer
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
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
            issuer: issuer
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
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
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
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
            issuer: issuer
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
            name: "Test Company",
            address: "123 Test St",
            taxId: "TEST123",
            email: "test@company.com"
        }).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
            issuer: issuer
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
