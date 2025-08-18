import { Numeric } from "./numeric";
import { ROUNDING, DECIMAL_PLACES } from "./rounding";

describe("Numeric", () => {
    test.each([
        ["123.45", ROUNDING.UP, DECIMAL_PLACES.TWO, "123.45"],
        ["67.89", ROUNDING.UP, DECIMAL_PLACES.TWO, "67.89"],
        ["0.123", ROUNDING.UP, DECIMAL_PLACES.TWO, "0.13"],
    ])(
        "creates Numeric from %s",
        (input, rounding, decimalPlaces, expected) => {
            const num = Numeric.fromString(input, decimalPlaces, rounding);
            expect(
                num.equals(
                    Numeric.fromString(expected,  decimalPlaces, rounding,)
                )
            ).toBe(true);
        }
    );

    test.each([
        ["2", "3", "6"],
        ["0.5", "0.2", "0.1"],
        ["100.35", "2", "200.7"],
    ])("multiplies %s and %s", (a, b, expected) => {
        const numA = Numeric.fromString(a,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const numB = Numeric.fromString(b,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = numA.multiplyBy(numB);
        expect(
            result.equals(
                Numeric.fromString(expected,  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });

    test.each([
        ["1.5", "2.5", "4"],
        ["0.1", "0.2", "0.3"],
        ["100.35", "2", "102.35"],
    ])("adds %s and %s", (a, b, expected) => {
        const numA = Numeric.fromString(a,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const numB = Numeric.fromString(b,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = numA.add(numB);
        expect(
            result.equals(
                Numeric.fromString(expected,  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });

    test.each([
        ["10.00", "10.00", true],
        ["10.00", "10.01", false],
        ["10.01", "10.01", true],
    ])("compares %s and %s", (a, b, expected) => {
        const numA = Numeric.fromString(a,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const numB = Numeric.fromString(b,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        expect(numA.equals(numB)).toBe(expected);
    });

    it("should handle multiplication with zero", () => {
        const a = Numeric.fromString("0",  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const b = Numeric.fromString("100",  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = a.multiplyBy(b);
        expect(
            result.equals(
                Numeric.fromString("0",  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });

    it("should handle addition with zero", () => {
        const a = Numeric.fromString("0",  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const b = Numeric.fromString("100",  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = a.add(b);
        expect(
            result.equals(
                Numeric.fromString("100",  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });

    it("should handle large numbers", () => {
        const a = Numeric.fromString(
            "1000000000000000000",
            DECIMAL_PLACES.TWO,
            ROUNDING.UP
        );
        const b = Numeric.fromString("2",  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = a.multiplyBy(b);
        expect(
            result.equals(
                Numeric.fromString(
                    "2000000000000000000",
                    DECIMAL_PLACES.TWO,
                    ROUNDING.UP
                )
            )
        ).toBe(true);
    });

    test.each([
        ["0.1", "0.2", "0.3"],
        ["0.12", "0.56", "0.68"],
        ["0.99", "0.01", "1.00"],
    ])("adds %s and %s", (a, b, expected) => {
        const numA = Numeric.fromString(a,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const numB = Numeric.fromString(b,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = numA.add(numB);
        expect(
            result.equals(
                Numeric.fromString(expected,  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });

    test.each([
        ["0.1345", "0.14"],
        ["0.1299", "0.13"],
        ["4.1550345", "4.16"],
    ])("rounds %s to %s", (input, expected) => {
        const a = Numeric.fromString(input,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        expect(a.rounding).toBe(ROUNDING.UP);
        expect(a.decimalPlaces).toBe(DECIMAL_PLACES.TWO);
        expect(
            a.equals(
                Numeric.fromString(expected,  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });

    test.each([
        ["0.1", "0.2", "0.5"],
        ["0.13", "0.57", "0.23"],
        ["0.99", "0.01", "99"],
    ])("divides %s by %s", (a, b, expected) => {
        const numA = Numeric.fromString(a,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const numB = Numeric.fromString(b,  DECIMAL_PLACES.TWO, ROUNDING.UP);
        const result = numA.divideBy(numB);
        expect(
            result.equals(
                Numeric.fromString(expected,  DECIMAL_PLACES.TWO, ROUNDING.UP)
            )
        ).toBe(true);
    });
});
