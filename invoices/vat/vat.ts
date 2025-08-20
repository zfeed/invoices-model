import { Money } from '../money/money';
import { Numeric } from '../numeric/numeric';
import { ROUNDING, DECIMAL_PLACES } from '../numeric/rounding';
export class Vat {
    #value: Numeric;

    public get rate(): Numeric {
        return this.#value;
    }

    private constructor(value: Numeric) {
        this.#value = value;
    }

    equals(other: Vat): boolean {
        return this.#value.equals(other.rate);
    }

    static fromPercent(value: string) {
        const oneHundred = Numeric.fromString('100');
        const percents = Numeric.fromString(value);

        const numericValue = percents.divideBy(oneHundred).toDecimalPlaces(DECIMAL_PLACES.TWO, ROUNDING.UP);

        return new Vat(numericValue);
    }

    applyTo(money: Money): Money {
        const vat = money.multiplyBy(this.rate);

        return money.add(vat);
    }
}
