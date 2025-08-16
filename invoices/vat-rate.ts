import { Numeric } from './numeric/numeric';
import { ROUNDING, DECIMAL_PLACES } from './numeric/rounding';
export class VatRate {
    #value: Numeric;

    public get value(): Numeric {
        return this.#value;
    }

    private constructor(value: Numeric) {
        this.#value = value;
    }

    equals(other: VatRate): boolean {
        return this.#value.equals(other.value);
    }

    static fromPercent(value: string) {
        const numericValue = Numeric.fromString(value, ROUNDING.UP, DECIMAL_PLACES.TWO).divideBy(Numeric.fromString('100', ROUNDING.UP, DECIMAL_PLACES.TWO));
        return new VatRate(numericValue);
    }
}
