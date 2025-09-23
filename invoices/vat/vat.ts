import { Result } from '../../building-blocks';
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

    static create(value: string) {
        const error = assertPercents(value);

        if (error) {
            return Result.error(error);
        }

        const oneHundred = Numeric.create('100');
        const percents = Numeric.create(value);

        const numericValue = percents.divideBy(oneHundred);

        return  Result.ok(new Vat(numericValue));
    }

    applyTo(money: Money) {
        const vat = money.multiplyBy(this.rate);

        return money.add(vat).unwrap();
    }
}
