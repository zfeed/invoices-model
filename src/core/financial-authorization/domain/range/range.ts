import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Money } from '../money/money';
import { checkCurrenciesEqual } from './checks/check-currencies-equal';
import { checkFromNotGreaterThanTo } from './checks/check-from-not-greater-than-to';

export class Range
    implements Equatable<Range>, Mappable<ReturnType<Range['toPlain']>>
{
    #from: Money;
    #to: Money;

    protected constructor(from: Money, to: Money) {
        this.#from = from;
        this.#to = to;
    }

    public get from(): Money {
        return this.#from;
    }

    public get to(): Money {
        return this.#to;
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

    static fromPlain(plain: {
        from: { amount: string; currency: string };
        to: { amount: string; currency: string };
    }) {
        return new Range(
            Money.fromPlain(plain.from),
            Money.fromPlain(plain.to)
        );
    }

    equals(other: Range): boolean {
        return this.#from.equals(other.#from) && this.#to.equals(other.#to);
    }

    toPlain() {
        return {
            from: this.#from.toPlain(),
            to: this.#to.toPlain(),
        };
    }

    toString(): string {
        return `${this.#from.toString()} - ${this.#to.toString()}`;
    }
}
