import { assertUnitQuantity } from './asserts/assert-unit-quantity';
import { Numeric } from '../numeric/numeric';

export class UnitQuantity {
    #value: Numeric;

    private constructor(value: Numeric) {
        this.#value = value;
    }

    static fromNumeric(value: Numeric) {
        assertUnitQuantity(value.toString());
        return new this(value);
    }

    get value(): Numeric {
        return this.#value;
    }

    equals(other: UnitQuantity) {
        return this.#value.equals(other.#value);
    }
}
