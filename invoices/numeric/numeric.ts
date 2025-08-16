import { Decimal } from 'decimal.js';
import { DECIMAL_PLACES, ROUNDING } from './rounding';

export  class Numeric {
    #value: Decimal;
    #rounding: ROUNDING;
    #decimalPlaces: DECIMAL_PLACES;

    private constructor(value: string, rounding: ROUNDING, decimalPlaces: DECIMAL_PLACES) {
        const roundingMode = rounding === ROUNDING.UP ? Decimal.ROUND_UP : null;

        if (roundingMode === null) {
            throw new Error(`Unsupported rounding mode: ${rounding}`);
        }

        this.#value = new Decimal(value).toDecimalPlaces(decimalPlaces, roundingMode);
        this.#rounding = rounding;
        this.#decimalPlaces = decimalPlaces;
    }

    static fromString(value: string, rounding: ROUNDING, decimalPlaces: DECIMAL_PLACES) {
        return new  this(value, rounding, decimalPlaces);
    }

    public get rounding() {
        return this.#rounding;
    }

    public get decimalPlaces() {
        return this.#decimalPlaces;
    }

    multiplyBy(value: Numeric) {
        return new Numeric(this.#value.mul(value.#value).toString(), this.#rounding, this.#decimalPlaces);
    }

    add(value: Numeric) {
        return new Numeric(this.#value.add(value.#value).toString(), this.#rounding, this.#decimalPlaces);
    }

    equals(value: Numeric) {
        return this.#value.equals(value.#value);
    }

    divideBy(value: Numeric) {
        return new Numeric(this.#value.div(value.#value).toString(), this.#rounding, this.#decimalPlaces);
    }
}
