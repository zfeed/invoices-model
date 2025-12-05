import { Equatable, Result } from '../../../../building-blocks';
import { Numeric } from '../../numeric/numeric';
import { ROUNDING } from '../../numeric/rounding';
import { Currency } from '../currency/currency';
import { checkEqualCurrencies } from './checks/check-equal-currencies';
import { checkMinorUnits } from './checks/check-minor-units';

export class Money implements Equatable<Money> {
    #amount: Numeric;
    #currency: Currency;

    private constructor(amount: Numeric, currency: Currency) {
        this.#amount = amount;
        this.#currency = currency;
    }

    public get amount(): Numeric {
        return this.#amount;
    }

    public get currency(): Currency {
        return this.#currency;
    }

    equals(other: Money): boolean {
        const isSameCurrency = this.#currency.equals(other.currency);
        const isSameAmount = this.#amount.equals(other.amount);

        return isSameCurrency && isSameAmount;
    }

    add(other: Money) {
        const error = checkEqualCurrencies(this.#currency, other.currency);

        if (error) {
            return Result.error(error);
        }

        const value = this.#amount.add(other.amount);

        return Result.ok(new Money(value, this.#currency));
    }

    subtract(other: Money) {
        const error = checkEqualCurrencies(this.#currency, other.currency);

        if (error) {
            return Result.error(error);
        }

        const value = this.#amount.subtract(other.amount);

        return Result.ok(new Money(value, this.#currency));
    }

    multiplyBy(factor: Numeric, rounding: ROUNDING = ROUNDING.UP): Money {
        const value = this.#amount
            .multiplyBy(factor)
            .toDecimalPlaces(0, rounding);
        return new Money(value, this.#currency);
    }

    static create(amount: string, currency: string) {
        const error = checkMinorUnits(amount);

        if (error) {
            return Result.error(error);
        }

        const numericValue = Numeric.create(amount);

        const currencyResult = Currency.create(currency);

        if (currencyResult.isError()) {
            return currencyResult.error();
        }

        return Result.ok(new Money(numericValue, currencyResult.unwrap()));
    }

    toString(): string {
        return `${this.#amount.toString()} ${this.#currency.toString()}`;
    }

    toPlain() {
        return {
            amount: this.#amount.toString(),
            currency: this.#currency.toString(),
        };
    }
}
