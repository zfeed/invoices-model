import { LineItem } from "./line-item";
import { UnitDescription } from "./unit-description";
import { UnitQuantity } from "./unit-quantity";
import { Money } from "../money/money/money";

describe("LineItem", () => {
    it("should create a line item", () => {
        const price = Money.create("100", "USD").unwrap();
        const lineItem = LineItem.create({
            description: "Product 1",
            price: {
                amount: "100",
                currency: "USD"
            },
            quantity: '4'
        }).unwrap();

        expect(lineItem.price.equals(price)).toBe(true);
        expect(
            lineItem.description.equals(UnitDescription.create("Product 1"))
        ).toBe(true);
        expect(
            lineItem.quantity.equals(
                UnitQuantity.create('4').unwrap()
            )
        ).toBe(true);
        expect(lineItem.total.equals(Money.create("400", "USD").unwrap())).toBe(
            true
        );
    });

    it.each([
        {
            lineItem1: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            lineItem2: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            expected: true,
        },
        {
            lineItem1: LineItem.create({
                description: "Product B",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            lineItem2: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            expected: false,
        },
        {
            lineItem1: LineItem.create({
                description: "Product A",
                price: {
                    amount: "60",
                    currency: "USD"
                },
                quantity: '2'
            }),
            lineItem2: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            expected: false,
        },
        {
            lineItem1: LineItem.create({
                description: "Product A",
                price: {
                    amount: "60",
                    currency: "USD"
                },
                quantity: '2'
            }),
            lineItem2: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            expected: false,
        },
        {
            lineItem1: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '2'
            }),
            lineItem2: LineItem.create({
                description: "Product A",
                price: {
                    amount: "50",
                    currency: "USD"
                },
                quantity: '3'
            }),
            expected: false,
        },
    ])(
        "should compare line items: %p",
        ({ lineItem1, lineItem2, expected }) => {
            expect(lineItem1.unwrap().equals(lineItem2.unwrap())).toBe(expected);
        }
    );
});
