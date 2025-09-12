import { Money } from "./money";
import { Numeric } from "../../numeric/numeric";
import { Currency } from "../currency/currency";

describe("Money", () => {
    test.each([
        {
            amount: "100",
            currency: "USD",
        },
        {
            amount: "30045",
            currency: "JPY",
        },
        {
            amount: "123",
            currency: "BHD",
        },
    ])("should create Money for %s", ({ amount, currency }) => {
        const money = Money.fromString(amount, currency).unwrap();
        const expectedAmount = Numeric.fromString(amount);
        const expectedCurrency = Currency.create(currency).unwrap();
        expect(money.amount.equals(expectedAmount)).toBe(true);
        expect(money.currency.equals(expectedCurrency)).toBe(true);
    });

    test.each([
        {
            amount1: "50",
            currency1: "USD",
            amount2: "50",
            currency2: "USD",
            expected: true,
        },
        {
            amount1: "150",
            currency1: "USD",
            amount2: "50",
            currency2: "USD",
            expected: false,
        },
        {
            amount1: "50",
            currency1: "USD",
            amount2: "50",
            currency2: "JPY",
            expected: false,
        },
    ])(
        "should return $expected for $amount1 $currency1 === $amount2 $currency2",
        ({ amount1, currency1, amount2, currency2, expected }) => {
            const money1 = Money.fromString(amount1, currency1).unwrap();
            const money2 = Money.fromString(amount2, currency2).unwrap();
            expect(money1.equals(money2)).toBe(expected);
        }
    );

    test("should create Money from string using fromString", () => {
        const money = Money.fromString("355435", "USD").unwrap();
        expect(money.amount.equals(Numeric.fromString("355435"))).toBe(true);
        expect(money.currency.equals(Currency.create("USD").unwrap())).toBe(true);
    });

    test("should create money from integer", () => {
        const money = Money.fromNumeric(
            Numeric.fromString("200"),
            Currency.create("USD").unwrap()
        ).unwrap();
        expect(money.amount.equals(Numeric.fromString("200"))).toBe(true);
        expect(money.currency.equals(Currency.create("USD").unwrap())).toBe(true);
    });

    test("should not create money from negative int", () => {
        const result = Money.fromNumeric(
            Numeric.fromString("-200"),
            Currency.create("USD").unwrap()
        );

        expect(result.value).toEqual(
            expect.objectContaining({
                code: '3001',
            })
        );
    });

    test("should not create money from decimal", () => {
        const result = Money.fromNumeric(
            Numeric.fromString("200.50"),
            Currency.create("USD").unwrap()
        );

        expect(result.value).toEqual(
            expect.objectContaining({
                code: '3000',
            })
        );
    });
});
