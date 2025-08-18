import { Money } from "./money";
import { CurrencyFactory } from "./currency/factory";
import { Numeric } from "../numeric/numeric";
import { DECIMAL_PLACES, ROUNDING } from "../numeric/rounding";
import { CURRENCY_CODE } from "./currency/code";

describe("Money", () => {
    test.each([
        {
            amount: "100.00",
            currency: CURRENCY_CODE.USD,
            decimalPlaces: DECIMAL_PLACES.TWO,
        },
        {
            amount: "30045",
            currency: CURRENCY_CODE.JPY,
            decimalPlaces: DECIMAL_PLACES.ZERO,
        },
        {
            amount: "123.421",
            currency: CURRENCY_CODE.BHD,
            decimalPlaces: DECIMAL_PLACES.THREE,
        },
    ])("should create Money for %s", ({ amount, currency, decimalPlaces }) => {
        const money = Money.create(amount, currency);
        const expectedAmount = Numeric.fromString(amount, decimalPlaces);
        const expectedCurrency = CurrencyFactory.fromISO4217(currency);
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
                Money.create(amount, currency);
            }).toThrow(`Invalid currency code: ${currency}`);
        }
    );

    test.each([
        {
            amount1: "50.00",
            currency1: CURRENCY_CODE.USD,
            amount2: "50.00",
            currency2: CURRENCY_CODE.USD,
            expected: true,
        },
        {
            amount1: "50.00",
            currency1: CURRENCY_CODE.USD,
            amount2: "50.01",
            currency2: CURRENCY_CODE.USD,
            expected: false,
        },
        {
            amount1: "50.00",
            currency1: CURRENCY_CODE.USD,
            amount2: "50.00",
            currency2: CURRENCY_CODE.JPY,
            expected: false,
        },
    ])(
        "should return $expected for $amount1 $currency1 === $amount2 $currency2",
        ({ amount1, currency1, amount2, currency2, expected }) => {
            const money1 = Money.create(amount1, currency1);
            const money2 = Money.create(amount2, currency2);
            expect(money1.equals(money2)).toBe(expected);
        }
    );

    test("should throw error when creating Money from Numeric with mismatched decimal places", () => {
        const numeric = Numeric.fromString(
            "123.45",
            DECIMAL_PLACES.TWO,
            ROUNDING.UP
        );
        const currency = CurrencyFactory.fromISO4217(CURRENCY_CODE.BHD);
        expect(() => {
            Money.fromNumeric(numeric, currency);
        }).toThrow("Amount decimal places (2) do not match currency (3)");
    });

    test("should create Money from string using fromString", () => {
        const money = Money.fromString("200.50", CURRENCY_CODE.USD);
        expect(
            money.amount.equals(Numeric.fromString("200.50", DECIMAL_PLACES.TWO))
        ).toBe(true);
        expect(money.currency.equals(CurrencyFactory.fromISO4217(CURRENCY_CODE.USD))).toBe(true);
    });
});
