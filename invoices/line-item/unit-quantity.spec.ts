import { UnitQuantity } from "./unit-quantity";
import { Numeric } from '../numeric/numeric';

describe("UnitQuantity", () => {
    it("should create a unit quantity", () => {
        const quantity = UnitQuantity.fromNumeric(Numeric.fromNumber(5)).unwrap();
        expect(quantity.value.equals(Numeric.fromNumber(5))).toBe(true);
    });

    it.each([-1, 0, -100, -5])("should not create quantity that is not positive: %p", (invalidQuantity) => {
        const result = UnitQuantity.fromNumeric(Numeric.fromNumber(invalidQuantity));

        expect(result.value).toEqual(expect.objectContaining({
            code: '1004'
        }));
    });

    it.each([1.3, 2.5, 3.7, 400.1])("should not create a quantity that is not integer: %p", (invalidQuantity) => {
        const result = UnitQuantity.fromNumeric(Numeric.fromNumber(invalidQuantity));

        expect(result.value).toEqual(expect.objectContaining({
            code: '1003'
        }));
    });
});
