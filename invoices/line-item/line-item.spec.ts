import { LineItem } from "./line-item";
import { UnitDescription } from "./unit-description";
import { UnitQuantity } from "./unit-quantity";
import { Money } from "../money/money/money";
import { Numeric } from "../numeric/numeric";

describe("LineItem", () => {
    it("should create a line item", () => {
        const price = Money.fromString("100", "USD").unwrap();
        const lineItem = LineItem.create(
            "Product 1",
            price,
            Numeric.fromNumber(4)
        ).unwrap();

        expect(lineItem.price.equals(price)).toBe(true);
        expect(
            lineItem.description.equals(UnitDescription.fromString("Product 1"))
        ).toBe(true);
        expect(
            lineItem.quantity.equals(
                UnitQuantity.fromNumeric(Numeric.fromNumber(4)).unwrap()
            )
        ).toBe(true);
        expect(lineItem.total.equals(Money.fromString("400", "USD").unwrap())).toBe(
            true
        );
    });

    it.each([
        {
            lineItem1: LineItem.create(
                "Product A",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            expected: true,
        },
        {
            lineItem1: LineItem.create(
                "Product B",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                "Product A",
                Money.fromString("60", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                "Product A",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD").unwrap(),
                Numeric.fromNumber(3)
            ),
            expected: false,
        },
    ])(
        "should compare line items: %p",
        ({ lineItem1, lineItem2, expected }) => {
            expect(lineItem1.unwrap().equals(lineItem2.unwrap())).toBe(expected);
        }
    );
});
