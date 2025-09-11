import { Money } from '../money/money/money';
import { Numeric } from '../numeric/numeric';
import { assertPercents } from './asserts/assert-percents'
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
        assertPercents(value);

        const oneHundred = Numeric.fromString('100');
        const percents = Numeric.fromString(value);

        const numericValue = percents.divideBy(oneHundred);

        return new Vat(numericValue);
    }

    applyTo(money: Money) {
        const vat = money.multiplyBy(this.rate);

        return money.add(vat);
    }
}
