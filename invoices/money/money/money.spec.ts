import { Money } from "./money";
import { Numeric } from "../../numeric/numeric";
import { ROUNDING } from "../../numeric/rounding";
import { Currency } from "../currency/currency";
import { InvalidCurrencyCodeError } from "../currency/asserts/assert-currency-code";
import { InvalidMinorUnitsError } from "./asserts/assert-minor-units";

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
        const money = Money.fromString(amount, currency);
        const expectedAmount = Numeric.fromString(amount);
        const expectedCurrency = new Currency(currency);
        expect(money.amount.equals(expectedAmount)).toBe(true);
        expect(money.currency.equals(expectedCurrency)).toBe(true);
    });

    test.each([
        { amount: "100.00", currency: "ABC" },
        { amount: "200.50", currency: "XYZ" },
    ])(
        "should throw error for invalid currency code",
        ({ amount, currency }) => {
            expect(() => {
                Money.fromString(amount, currency);
            }).toThrow(InvalidCurrencyCodeError);
        }
    );

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
            const money1 = Money.fromString(amount1, currency1);
            const money2 = Money.fromString(amount2, currency2);
            expect(money1.equals(money2)).toBe(expected);
        }
    );

    test("should create Money from string using fromString", () => {
        const money = Money.fromString("355435", "USD");
        expect(money.amount.equals(Numeric.fromString("355435"))).toBe(true);
        expect(money.currency.equals(new Currency("USD"))).toBe(true);
    });

    test("should create money from integer", () => {
        const money = Money.fromNumeric(
            Numeric.fromString("200"),
            new Currency("USD")
        );
        expect(money.amount.equals(Numeric.fromString("200"))).toBe(true);
        expect(money.currency.equals(new Currency("USD"))).toBe(true);
    });

    test("should not create money from negative int", () => {
        expect(() => {
            Money.fromNumeric(Numeric.fromString("-200"), new Currency("USD"));
        }).toThrow(InvalidMinorUnitsError);
    });


     test("should not create money from decimal", () => {
         expect(() => {
             Money.fromNumeric(Numeric.fromString("200.50"), new Currency("USD"));
         }).toThrow(InvalidMinorUnitsError);
     });
});
