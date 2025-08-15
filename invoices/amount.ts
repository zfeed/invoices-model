import { Numeric } from './numeric';

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

    static fromString(value: string) {
        return new Amount(Numeric.fromString(value));
    }

    static fromNumeric(value: Numeric) {
        return new Amount(value);
    }
}
