import { Money } from "../money/money/money";
import { Invoice } from "./invoice";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { Numeric } from "../numeric/numeric";
import { IssueDate } from "../calendar-date/calendar-date";

describe("Invoice", () => {
    it("should create an Invoice instance", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD").unwrap(),
            Numeric.fromString("1")
        ).unwrap();
        const issueDate = IssueDate.create("2023-01-01").unwrap();
        const dueDate = IssueDate.create("2028-01-01").unwrap();

        const invoice = Invoice.create({
            issueDate: issueDate,
            dueDate: dueDate,
            lineItems: [lineItem1, lineItem2],
        }).unwrap();

        expect(invoice.total.equals(Money.fromString("130", "USD").unwrap())).toBe(true);
        expect(invoice.vat.equals(Vat.fromPercent("0"))).toBe(true);
        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.issueDate.equals(issueDate)).toBe(true);
        expect(invoice.dueDate.equals(dueDate)).toBe(true);
    });

    it("should apply VAT to invoice total", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD").unwrap(),
            Numeric.fromString("1")
        ).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
        }).unwrap();
        const vat = Vat.fromPercent("20");

        const result = invoice.applyVat(vat);

        expect(invoice.total.equals(Money.fromString("156", "USD").unwrap())).toBe(true);
        expect(invoice.vat.equals(Vat.fromPercent("20"))).toBe(true);
        expect(result.isRight()).toBe(true);
    });

    it("should reapply VAT to invoice total", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD").unwrap(),
            Numeric.fromString("1")
        ).unwrap();

        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
        }).unwrap();
        const vat1 = Vat.fromPercent("20");
        const vat2 = Vat.fromPercent("10");

        invoice.applyVat(vat1);
        invoice.applyVat(vat2);

        expect(invoice.total.equals(Money.fromString("143", "USD").unwrap())).toBe(true);
        expect(invoice.vat.equals(Vat.fromPercent("10"))).toBe(true);
    });

    it("should not create an invoice with no line items", () => {
        const result = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [],
        });

        expect(result.value).toEqual(
            expect.objectContaining({
                code: 0,
            })
        );
    });

    it("should not create an invoice with line items that have different currency", () => {
        const result = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [
                LineItem.create(
                    "Item 1",
                    Money.fromString("50", "USD").unwrap(),
                    Numeric.fromString("2")
                ).unwrap(),
                LineItem.create(
                    "Item 2",
                    Money.fromString("30", "EUR").unwrap(),
                    Numeric.fromString("1")
                ).unwrap(),
            ],
        });

        expect(result.value).toEqual(
            expect.objectContaining({
                code: 1,
            })
        );
    });

    it("should add a line item", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1],
        }).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD").unwrap(),
            Numeric.fromString("4")
        ).unwrap();

        invoice.addLineItem(lineItem2);

        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.total.equals(Money.fromString("220", "USD").unwrap())).toBe(true);
    });

    it("should add respect applied vat when a line item added", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1],
        }).unwrap();

        invoice.applyVat(Vat.fromPercent("10"));

        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD").unwrap(),
            Numeric.fromString("4")
        ).unwrap();

        invoice.addLineItem(lineItem2);

        expect(invoice.total.equals(Money.fromString("242", "USD").unwrap())).toBe(true);
    });

    it("should not add a duplicate line item", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1],
        }).unwrap();

        const result = invoice.addLineItem(lineItem1);

        expect(result.value).toEqual(
            expect.objectContaining({
                code: 2,
            })
        );
    });

    it("should remove a line item", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("40", "USD").unwrap(),
            Numeric.fromString("5")
        ).unwrap();
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
        }).unwrap();

        const removedItem = invoice.removeLineItem(
            LineItem.create(
                "Item 1",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromString("2")
            ).unwrap()
        ).unwrap();

        expect(removedItem).toBeDefined();
        expect(removedItem?.equals(lineItem1)).toBe(true);
        expect(invoice.lineItems).toHaveLength(1);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
    });

    it("should change total when a line item is removed", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("40", "USD").unwrap(),
            Numeric.fromString("5")
        ).unwrap();
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
        }).unwrap();

        invoice.removeLineItem(
            LineItem.create(
                "Item 1",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromString("2")
            ).unwrap()
        );

        expect(invoice.total.equals(Money.fromString("200", "USD").unwrap())).toBe(true);
    });

    it("should change total according to applied vat when a line item is removed", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD").unwrap(),
            Numeric.fromString("2")
        ).unwrap();
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("40", "USD").unwrap(),
            Numeric.fromString("5")
        ).unwrap();
        const invoice = Invoice.create({
            issueDate: IssueDate.create("2023-01-01").unwrap(),
            dueDate: IssueDate.create("2023-02-01").unwrap(),
            lineItems: [lineItem1, lineItem2],
        }).unwrap();

        invoice.applyVat(Vat.fromPercent("10"));

        invoice.removeLineItem(
            LineItem.create(
                "Item 1",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromString("2")
            ).unwrap()
        );

        expect(invoice.total.equals(Money.fromString("220", "USD").unwrap())).toBe(true);
    });
});
