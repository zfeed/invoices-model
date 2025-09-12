import { LineItem } from "./line-item";
import { UnitDescription } from "./unit-description";
import { UnitQuantity } from "./unit-quantity";
import { Money } from "../money/money/money";
import { Numeric } from "../numeric/numeric";

describe("LineItem", () => {
    it("should create a line item", () => {
        const price = Money.create("100", "USD").unwrap();
        const lineItem = LineItem.create(
            UnitDescription.create("Product 1"),
            price,
            Numeric.create('4')
        ).unwrap();

        expect(lineItem.price.equals(price)).toBe(true);
        expect(
            lineItem.description.equals(UnitDescription.create("Product 1"))
        ).toBe(true);
        expect(
            lineItem.quantity.equals(
                UnitQuantity.create(Numeric.create('4')).unwrap()
            )
        ).toBe(true);
        expect(lineItem.total.equals(Money.create("400", "USD").unwrap())).toBe(
            true
        );
    });

    it.each([
        {
            lineItem1: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            lineItem2: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            expected: true,
        },
        {
            lineItem1: LineItem.create(
                UnitDescription.create("Product B"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            lineItem2: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("60", "USD").unwrap(),
                Numeric.create('2')
            ),
            lineItem2: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("60", "USD").unwrap(),
                Numeric.create('2')
            ),
            lineItem2: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            expected: false,
        },
        {
            lineItem1: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('2')
            ),
            lineItem2: LineItem.create(
                UnitDescription.create("Product A"),
                Money.create("50", "USD").unwrap(),
                Numeric.create('3')
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
