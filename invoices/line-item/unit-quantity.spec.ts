import { UnitQuantity } from "./unit-quantity";
import { Numeric } from '../numeric/numeric';

describe("UnitQuantity", () => {
    it("should create a unit quantity", () => {
        const quantity = UnitQuantity.create('4').unwrap();
        expect(quantity.value.equals(Numeric.create('4'))).toBe(true);
    });

    it.each(['-1', '0', '-100', '-5'])("should not create quantity that is not positive: %p", (invalidQuantity) => {
        const result = UnitQuantity.create(invalidQuantity);

        expect(result.value).toEqual(expect.objectContaining({
            code: '2001'
        }));
    });

    it.each(['1.3', '2.5', '3.7', '400.1'])("should not create a quantity that is not integer: %p", (invalidQuantity) => {
        const result = UnitQuantity.create(invalidQuantity);
        expect(result.value).toEqual(expect.objectContaining({
            code: '2000'
        }));
    });
});
