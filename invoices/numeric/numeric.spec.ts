import { Numeric } from "./numeric";
import { ROUNDING } from "./rounding";

describe("Numeric", () => {
    test.each([
        ["123.45", "123.45"],
        ["67.89", "67.89"],
        ["0.123", "0.123"],
    ])("creates Numeric from %s", (input, expected) => {
        const num = Numeric.create(input);
        expect(num.equals(Numeric.create(expected))).toBe(true);
    });

    test.each([
        ["2", "3", "6"],
        ["0.5", "0.2", "0.1"],
        ["100.35", "2", "200.7"],
    ])("multiplies %s and %s", (a, b, expected) => {
        const numA = Numeric.create(a);
        const numB = Numeric.create(b);
        const result = numA.multiplyBy(numB);
        expect(result.equals(Numeric.create(expected))).toBe(true);
    });

    test.each([
        ["1.5", "2.5", "4"],
        ["0.1", "0.2", "0.3"],
        ["100.35", "2", "102.35"],
    ])("adds %s and %s", (a, b, expected) => {
        const numA = Numeric.create(a);
        const numB = Numeric.create(b);
        const result = numA.add(numB);
        expect(result.equals(Numeric.create(expected))).toBe(true);
    });

    test.each([
        ["10.00", "10.00", true],
        ["10.00", "10.01", false],
        ["10.01", "10.01", true],
    ])("compares %s and %s", (a, b, expected) => {
        const numA = Numeric.create(a);
        const numB = Numeric.create(b);
        expect(numA.equals(numB)).toBe(expected);
    });

    it("should handle multiplication with zero", () => {
        const a = Numeric.create("0");
        const b = Numeric.create("100");
        const result = a.multiplyBy(b);
        expect(result.equals(Numeric.create("0"))).toBe(true);
    });

    it("should handle addition with zero", () => {
        const a = Numeric.create("0");
        const b = Numeric.create("100");
        const result = a.add(b);
        expect(result.equals(Numeric.create("100"))).toBe(true);
    });

    it("should handle large numbers", () => {
        const a = Numeric.create("1000000000000000000");
        const b = Numeric.create("2");
        const result = a.multiplyBy(b);
        expect(result.equals(Numeric.create("2000000000000000000"))).toBe(
            true
        );
    });

    test.each([
        ["0.1", "0.2", "0.3"],
        ["0.12", "0.56", "0.68"],
        ["0.99", "0.01", "1.00"],
    ])("adds %s and %s", (a, b, expected) => {
        const numA = Numeric.create(a);
        const numB = Numeric.create(b);
        const result = numA.add(numB);
        expect(result.equals(Numeric.create(expected))).toBe(true);
    });

    test.each([
        ["0.1", "0.2", "0.5"],
        ["0.13", "0.57", "0.22807017543859649123"],
        ["0.99", "0.01", "99"],
    ])("divides %s by %s", (a, b, expected) => {
        const numA = Numeric.create(a);
        const numB = Numeric.create(b);
        const result = numA.divideBy(numB);
        expect(result.equals(Numeric.create(expected))).toBe(true);
    });
    
        describe("comparison methods", () => {
            const a = Numeric.create("10.5");
            const b = Numeric.create("10.5");
            const c = Numeric.create("11.0");
            const d = Numeric.create("9.99");

            test("lessThanEqual", () => {
                expect(a.lessThanEqual(b)).toBe(true);
                expect(a.lessThanEqual(c)).toBe(true);
                expect(c.lessThanEqual(a)).toBe(false);
            });

            test("greaterThanEqual", () => {
                expect(a.greaterThanEqual(b)).toBe(true);
                expect(c.greaterThanEqual(a)).toBe(true);
                expect(a.greaterThanEqual(c)).toBe(false);
            });

            test("lessThan", () => {
                expect(a.lessThan(c)).toBe(true);
                expect(d.lessThan(a)).toBe(true);
                expect(a.lessThan(d)).toBe(false);
                expect(a.lessThan(b)).toBe(false);
            });

            test("greaterThan", () => {
                expect(c.greaterThan(a)).toBe(true);
                expect(a.greaterThan(d)).toBe(true);
                expect(d.greaterThan(a)).toBe(false);
                expect(a.greaterThan(b)).toBe(false);
            });
        });

        describe("decimalPlaces", () => {
            test("returns correct decimal places", () => {
                expect(Numeric.create("10.5").decimalPlaces()).toBe(1);
                expect(Numeric.create("10.50").decimalPlaces()).toBe(1);
                expect(Numeric.create("10").decimalPlaces()).toBe(0);
                expect(Numeric.create("0.1234").decimalPlaces()).toBe(4);
            });
        });
});
