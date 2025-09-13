import { Currency } from "./currency";

describe("Currency", () => {
    test("should create currency", () => {
        const result = Currency.create("USD").unwrap();

        expect(result).toBeDefined();
    });

    test('should compare the same currencies as equal', () => {
        const currency1 = Currency.create("USD").unwrap();
        const currency2 = Currency.create("USD").unwrap();

        expect(currency1.equals(currency2)).toBe(true);
    });

    test('should compare different currencies as not equal', () => {
        const currency1 = Currency.create("USD").unwrap();
        const currency2 = Currency.create("JPY").unwrap();

        expect(currency1.equals(currency2)).toBe(false);
    });

    test.each([
        { currency: "ABC" },
        { currency: "XYZ" },
    ])(
        "should return error for invalid currency code",
        ({ currency }) => {
            const result = Currency.create(currency);

            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '5000',
                })
            );
        }
    );
});
