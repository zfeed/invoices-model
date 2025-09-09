import { LineItem } from "./line-item";
import { UnitDescription } from "./unit-description";
import { UnitQuantity } from "./unit-quantity";
import { InvalidQuantityError } from "./asserts/assert-unit-quantity";
import { Money } from "../money/money/money";
import { Numeric } from "../numeric/numeric";

describe("LineItem", () => {
    it("should create a LineItem instance", () => {
        const price = Money.fromString("100", "USD");
        const lineItem = LineItem.create(
            "Product 1",
            price,
            Numeric.fromNumber(4)
        );

        expect(lineItem.price.equals(price)).toBe(true);
        expect(
            lineItem.description.equals(UnitDescription.fromString("Product 1"))
        ).toBe(true);
        expect(
            lineItem.quantity.equals(
                UnitQuantity.fromNumeric(Numeric.fromNumber(4))
            )
        ).toBe(true);
        expect(lineItem.total.equals(Money.fromString("400", "USD"))).toBe(
            true
        );
    });

    it.each([-1, 0, 2.5, -3.7, 4.1])(
        "should throw an error for quantity: %p",
        (invalidQuantity) => {
            expect(() => {
                LineItem.create(
                    "Product 1",
                    Money.fromString("100", "USD"),
                    Numeric.fromNumber(invalidQuantity)
                );
            }).toThrow(InvalidQuantityError);
        }
    );

    it.each([
        {
            lineItem1: LineItem.create(
                "Product A",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(2)
            ),
            expected: true,
        },
        {
            lineItem1: LineItem.create(
                "Product B",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(2)
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                "Product A",
                Money.fromString("60", "USD"),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(2)
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                "Product A",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(2)
            ),
            lineItem2: LineItem.create(
                "Product A",
                Money.fromString("50", "USD"),
                Numeric.fromNumber(3)
            ),
            expected: false,
        },
    ])(
        "should compare line items: %p",
        ({ lineItem1, lineItem2, expected }) => {
            expect(lineItem1.equals(lineItem2)).toBe(expected);
        }
    );
});
