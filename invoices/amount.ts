import { Numeric } from './numeric/numeric';
import { ROUNDING, DECIMAL_PLACES } from './numeric/rounding';

export class Amount {
    #value: Numeric;

    public get value(): Numeric {
        return this.#value;
    }

    private constructor(value: Numeric) {
        this.#value = value;
    }

    equals(other: Amount): boolean {
        return this.#value.equals(other.value);
    }

    static fromString(value: string, decimalPlaces: DECIMAL_PLACES): Amount {
        return new Amount(Numeric.fromString(value, ROUNDING.UP, decimalPlaces));
    }

    static fromNumeric(value: Numeric) {
        return new Amount(value);
    }
}
