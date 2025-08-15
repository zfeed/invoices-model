import { Decimal } from 'decimal.js';

export  class Numeric {
    #value: Decimal;

    private constructor(value: string) {
        this.#value = new Decimal(value);
    }

    static fromString(value: string) {
        return new  this(value);
    }

    multiplyBy(value: Numeric) {
        return new Numeric(this.#value.mul(value.#value).toString());
    }

    add(value: Numeric) {
        return new Numeric(this.#value.add(value.#value).toString());
    }

    equals(value: Numeric) {
        return this.#value.equals(value.#value);
    }
}
