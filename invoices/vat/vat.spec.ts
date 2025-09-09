import { Vat } from "./vat";
import { InvalidPercentsError } from "./asserts/assert-percents";
import { Numeric } from "../numeric/numeric";

describe("Vat", () => {
    describe("fromPercent", () => {
        it("creates Vat with correct rate from percent string", () => {
            const vat = Vat.fromPercent("20");
            expect(vat.rate.equals(Numeric.fromString("0.2"))).toBe(true);
        });
        it("throws for invalid percent string", () => {
            expect(() => Vat.fromPercent("abc")).toThrow();
            expect(() => Vat.fromPercent("-5")).toThrow();
            expect(() => Vat.fromPercent("101")).toThrow();
        });
    });

    describe("rate", () => {
        it("returns the correct rate", () => {
            const vat = Vat.fromPercent("10");
            expect(vat.rate.equals(Numeric.fromString("0.1"))).toBe(true);
        });
    });

    describe("rate", () => {
        it("returns the correct rate", () => {
            const vat = Vat.fromPercent("10");
            expect(vat.rate.equals(Numeric.fromString("0.1"))).toBe(true);
        });

        it("returns the correct rate", () => {
            const vat = Vat.fromPercent("0");
            expect(vat.rate.equals(Numeric.fromString("0"))).toBe(true);
        });

        it("throws for invalid percent string", () => {
            expect(() => Vat.fromPercent("-1")).toThrow(InvalidPercentsError);
        });

        it("throws for invalid percent string", () => {
            expect(() => Vat.fromPercent("4.235")).toThrow(
                InvalidPercentsError
            );
        });
    });

    describe("equals", () => {
        it("returns true for same rate", () => {
            const vat1 = Vat.fromPercent("15");
            const vat2 = Vat.fromPercent("15");
            expect(vat1.equals(vat2)).toBe(true);
        });
        it("returns false for different rates", () => {
            const vat1 = Vat.fromPercent("15");
            const vat2 = Vat.fromPercent("20");
            expect(vat1.equals(vat2)).toBe(false);
        });
    });
});
