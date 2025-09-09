import { UnitQuantity } from "./unit-quantity";
import { InvalidQuantityError } from './asserts/assert-unit-quantity';
import { Numeric } from '../numeric/numeric';

describe("UnitQuantity", () => {
    it("should create a unit quantity", () => {
        const quantity = UnitQuantity.fromNumeric(Numeric.fromNumber(5));
        expect(quantity.value.equals(Numeric.fromNumber(5))).toBe(true);
    });

    it.each([-1, 0, 2.5, -3.7, 4.1])("should throw an error for quantity: %p", (invalidQuantity) => {
        expect(() => {
            UnitQuantity.fromNumeric(Numeric.fromNumber(invalidQuantity));
        }).toThrow(InvalidQuantityError);
    });
});
