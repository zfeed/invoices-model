import { Decimal } from 'decimal.js';
import { DECIMAL_PLACES, ROUNDING } from './rounding';

export  class Numeric {
    #value: Decimal;
    #rounding: ROUNDING;
    #decimalPlaces: DECIMAL_PLACES;

    private constructor(value: string, rounding?: ROUNDING, decimalPlaces? : DECIMAL_PLACES) {
        const roundingMode = rounding === ROUNDING.UP ? Decimal.ROUND_UP :  Decimal.ROUND_UP;


        this.#value = new Decimal(value).toDecimalPlaces(decimalPlaces || DECIMAL_PLACES.EIGHT, roundingMode);
        this.#rounding = rounding || ROUNDING.UP;
        this.#decimalPlaces = decimalPlaces || DECIMAL_PLACES.EIGHT;
    }

    static fromString(value: string, decimalPlaces?: DECIMAL_PLACES,  rounding?: ROUNDING,) {
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

    toDecimalPlaces(decimalPlaces: DECIMAL_PLACES, mode: ROUNDING) {
        let roundingMode: Decimal.Rounding;
        switch (mode) {
            case ROUNDING.UP:
                roundingMode = Decimal.ROUND_UP;
                break;
            default:
                throw new Error(`Unsupported rounding mode: ${mode}`);
        }

        const value =this.#value.toDecimalPlaces(decimalPlaces, roundingMode);

        return new Numeric(value.toString(), mode, decimalPlaces);
    }
}
