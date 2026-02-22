import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Money } from '../money/money/money';
import { Numeric } from '../numeric/numeric';
import { checkPercents } from './checks/check-percents';
export class VatRate implements Equatable<VatRate>, Mappable<ReturnType<VatRate['toPlain']>> {
    #value: Numeric;

    public get rate(): Numeric {
        return this.#value;
    }

    protected constructor(value: Numeric) {
        this.#value = value;
    }

    equals(other: VatRate): boolean {
        return this.#value.equals(other.rate);
    }

    static fromPlain(value: string) {
        const oneHundred = Numeric.create('100').unwrap();
        const percents = Numeric.create(value).unwrap();
        return new VatRate(percents.divideBy(oneHundred).unwrap());
    }

    static create(value: string) {
        const error = checkPercents(value);

        if (error) {
            return Result.error(error);
        }

        const oneHundred = Numeric.create('100').unwrap();
        const percents = Numeric.create(value).unwrap();

        const numericValue = percents.divideBy(oneHundred).unwrap();

        return Result.ok(new VatRate(numericValue));
    }

    applyTo(money: Money) {
        const vat = money.multiplyBy(this.rate);

        return money.add(vat).unwrap();
    }

    toPlain() {
        return this.#value.multiplyBy(Numeric.create('100').unwrap()).toString();
    }
}
