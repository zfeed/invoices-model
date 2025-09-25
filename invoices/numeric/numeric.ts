import { Decimal } from 'decimal.js';
import { ROUNDING } from './rounding';

export class Numeric {
    #value: Decimal;
    private constructor(value: string) {
        this.#value = new Decimal(value);
    }

    static create(value: string) {
        return new this(value);
    }

    multiplyBy(value: Numeric) {
        const result = this.#value.mul(value.#value);
        return new Numeric(result.toString());
    }

    add(value: Numeric) {
        return new Numeric(this.#value.add(value.#value).toString());
    }

    subtract(value: Numeric) {
        return new Numeric(this.#value.sub(value.#value).toString());
    }

    divideBy(value: Numeric) {
        const result = this.#value.div(value.#value);
        return new Numeric(result.toString());
    }

    toDecimalPlaces(places: number, rounding: ROUNDING = ROUNDING.UP) {
        const result = this.#value.toDecimalPlaces(places, rounding);
        return new Numeric(result.toString());
    }

    decimalPlaces(): number {
        return this.#value.decimalPlaces();
    }

    greaterThan(value: Numeric) {
        return this.#value.gt(value.#value);
    }

    lessThan(value: Numeric) {
        return this.#value.lt(value.#value);
    }

    greaterThanEqual(value: Numeric) {
        return this.#value.gte(value.#value);
    }

    lessThanEqual(value: Numeric) {
        return this.#value.lte(value.#value);
    }

    equals(value: Numeric) {
        return this.#value.equals(value.#value);
    }

    toString() {
        return this.#value.toString();
    }
}
