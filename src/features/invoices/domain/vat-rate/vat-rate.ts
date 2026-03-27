import { Equatable, Mappable, Result } from '../../../../shared';
import { Money } from '../money/money/money';
import { Numeric } from '../numeric/numeric';
import { checkPercents } from './checks/check-percents';
export class VatRate
    implements Equatable<VatRate>, Mappable<ReturnType<VatRate['toPlain']>>
{
    protected _value: Numeric;

    public get rate(): Numeric {
        return this._value;
    }

    protected constructor(value: Numeric) {
        this._value = value;
    }

    equals(other: VatRate): boolean {
        return this._value.equals(other.rate);
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

    addTo(money: Money) {
        const vat = money.multiplyBy(this.rate);

        return money.add(vat);
    }

    toPlain() {
        return this._value.toString();
    }
}
