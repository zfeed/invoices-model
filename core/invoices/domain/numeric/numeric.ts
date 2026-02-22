import { Decimal } from 'decimal.js';
import { Comparable, Equatable } from '../../../../building-blocks';
import { ROUNDING } from './rounding';

export class Numeric implements Equatable<Numeric>, Comparable<Numeric> {
    #value: Decimal;
    protected constructor(value: string) {
        this.#value = new Decimal(value);
    }

    static create(value: string): Numeric {
        return new Numeric(value);
    }

    multiplyBy(value: Numeric): Numeric {
        return new Numeric(this.#value.mul(value.#value).toString());
    }

    add(value: Numeric): Numeric {
        return new Numeric(this.#value.add(value.#value).toString());
    }

    subtract(value: Numeric): Numeric {
        return new Numeric(this.#value.sub(value.#value).toString());
    }

    divideBy(value: Numeric): Numeric {
        return new Numeric(this.#value.div(value.#value).toString());
    }

    toDecimalPlaces(places: number, rounding: ROUNDING = ROUNDING.UP): Numeric {
        return new Numeric(this.#value.toDecimalPlaces(places, rounding).toString());
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
