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
        const money = Money.create(amount, currency).unwrap();
        const expectedAmount = Numeric.create(amount);
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
            const money1 = Money.create(amount1, currency1).unwrap();
            const money2 = Money.create(amount2, currency2).unwrap();
            expect(money1.equals(money2)).toBe(expected);
        }
    );

    test("should create Money from string using create", () => {
        const money = Money.create("355435", "USD").unwrap();
        expect(money.amount.equals(Numeric.create("355435"))).toBe(true);
        expect(money.currency.equals(Currency.create("USD").unwrap())).toBe(true);
    });

    test("should create money from integer", () => {
        const money = Money.create(
            "200",
            'USD'
        ).unwrap();
        expect(money.amount.equals(Numeric.create("200"))).toBe(true);
        expect(money.currency.equals(Currency.create("USD").unwrap())).toBe(true);
    });

    test("should not create money from negative int", () => {
        const result = Money.create(
            "-200",
            "USD"
        );

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4001',
            })
        );
    });

    test("should not create money from decimal", () => {
        const result = Money.create(
            "200.50",
            "USD"
        );

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4000',
            })
        );
    });

    test("should not add two Money values with different currencies", () => {
        const money1 = Money.create("100", "USD").unwrap();
        const money2 = Money.create("50", "EUR").unwrap();

        const result = money1.add(money2);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4002',
            })
        );
    });
});
