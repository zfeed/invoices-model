import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Money } from '../money/money';
import { checkCurrenciesEqual } from './checks/check-currencies-equal';
import { checkFromNotGreaterThanTo } from './checks/check-from-not-greater-than-to';

export class Range
    implements Equatable<Range>, Mappable<ReturnType<Range['toPlain']>>
{
    protected _from: Money;
    protected _to: Money;

    protected constructor(from: Money, to: Money) {
        this._from = from;
        this._to = to;
    }

    public get from(): Money {
        return this._from;
    }

    public get to(): Money {
        return this._to;
    }

    static create(from: Money, to: Money) {
        const currError = checkCurrenciesEqual(from, to);
        if (currError) {
            return Result.error(currError);
        }

        const rangeError = checkFromNotGreaterThanTo(from, to);
        if (rangeError) {
            return Result.error(rangeError);
        }

        return Result.ok(new Range(from, to));
    }

    equals(other: Range): boolean {
        return this._from.equals(other._from) && this._to.equals(other._to);
    }

    toPlain() {
        return {
            from: this._from.toPlain(),
            to: this._to.toPlain(),
        };
    }

    toString(): string {
        return `${this._from.toString()} - ${this._to.toString()}`;
    }
}
