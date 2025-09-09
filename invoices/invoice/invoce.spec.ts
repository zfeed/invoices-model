import { Money } from "../money/money/money";
import { Invoice } from "./invoice";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { Numeric } from "../numeric/numeric";
import { InvalidLineItemsError } from "./asserts/assert-line-items";

describe("Invoice", () => {
    it("should create an Invoice instance with line items", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        );
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD"),
            Numeric.fromString("1")
        );
        const invoice = Invoice.create({
            lineItems: [lineItem1, lineItem2],
        });

        expect(invoice.total.equals(Money.fromString("130", "USD"))).toBe(true);
        expect(invoice.vat.equals(Vat.fromPercent("0"))).toBe(true);
        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
    });

    it("should apply VAT to invoice total", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        );
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD"),
            Numeric.fromString("1")
        );

        const invoice = Invoice.create({
            lineItems: [lineItem1, lineItem2],
        });
        const vat = Vat.fromPercent("20");

        invoice.applyVat(vat);

        expect(invoice.total.equals(Money.fromString("156", "USD"))).toBe(true);
        expect(invoice.vat.equals(Vat.fromPercent("20"))).toBe(true);
    });

    it("should not create an invoice with no line items", () => {
        expect(() =>
            Invoice.create({
                lineItems: [],
            })
        ).toThrow(InvalidLineItemsError);
    });

    it("should not create an invoice with line items that have different currency", () => {
        expect(() =>
            Invoice.create({
                lineItems: [
                    LineItem.create(
                        "Item 1",
                        Money.fromString("50", "USD"),
                        Numeric.fromString("2")
                    ),
                    LineItem.create(
                        "Item 2",
                        Money.fromString("30", "EUR"),
                        Numeric.fromString("1")
                    ),
                ],
            })
        ).toThrow(InvalidLineItemsError);
    });
    it("should add a line item", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        );
        const invoice = Invoice.create({
            lineItems: [lineItem1],
        });
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD"),
            Numeric.fromString("4")
        );
        
        invoice.addLineItem(lineItem2);


        expect(invoice.lineItems).toHaveLength(2);  
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.total.equals(Money.fromString("220", "USD"))).toBe(true);
    });


    it("should add respect applied vat when a line item added", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        );
        const invoice = Invoice.create({
            lineItems: [lineItem1],
        });

        invoice.applyVat(Vat.fromPercent("10"));

        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("30", "USD"),
            Numeric.fromString("4")
        );

        invoice.addLineItem(lineItem2);

        expect(invoice.total.equals(Money.fromString("242", "USD"))).toBe(true);
    });

    it("should not add a duplicate line item", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        );
        const invoice = Invoice.create({
            lineItems: [lineItem1],
        });

        expect(() => invoice.addLineItem(lineItem1)).toThrow(InvalidLineItemsError);
    });

    it("should remove a line item", () => {
        const lineItem1 = LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        );
        const lineItem2 = LineItem.create(
            "Item 2",
            Money.fromString("40", "USD"),
            Numeric.fromString("5")
        );
        const invoice = Invoice.create({
            lineItems: [lineItem1, lineItem2],
        });

        const removedItem = invoice.removeLineItem(LineItem.create(
            "Item 1",
            Money.fromString("50", "USD"),
            Numeric.fromString("2")
        ));

        expect(removedItem).toBeDefined();
        expect(removedItem?.equals(lineItem1)).toBe(true);
        expect(invoice.lineItems).toHaveLength(1);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
    });
});
