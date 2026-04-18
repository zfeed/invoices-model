import {
    Equatable,
    Mappable,
    Result,
} from '../../../../building-blocks/index.ts';
import { Numeric } from '../../numeric/numeric.ts';
import { ROUNDING } from '../../numeric/rounding.ts';
import { Currency } from '../currency/currency.ts';
import { checkEqualCurrencies } from './checks/check-equal-currencies.ts';
import { checkMinorUnits } from './checks/check-minor-units.ts';

export class Money
    implements Equatable<Money>, Mappable<ReturnType<Money['toPlain']>>
{
    protected _amount: Numeric;
    protected _currency: Currency;

    protected constructor(amount: Numeric, currency: Currency) {
        this._amount = amount;
        this._currency = currency;
    }

    get amount(): Numeric {
        return this._amount;
    }

    get currency(): Currency {
        return this._currency;
    }

    equals(other: Money): boolean {
        const isSameCurrency = this._currency.equals(other._currency);
        const isSameAmount = this._amount.equals(other._amount);

        return isSameCurrency && isSameAmount;
    }

    add(other: Money) {
        const error = checkEqualCurrencies(this._currency, other._currency);

        if (error) {
            return Result.error(error);
        }

        const value = this._amount.add(other._amount);

        return Result.ok(new Money(value, this._currency));
    }

    subtract(other: Money) {
        const error = checkEqualCurrencies(this._currency, other._currency);

        if (error) {
            return Result.error(error);
        }

        const value = this._amount.subtract(other._amount);

        return Result.ok(new Money(value, this._currency));
    }

    multiplyBy(factor: Numeric, rounding: ROUNDING = ROUNDING.UP): Money {
        const value = this._amount
            .multiplyBy(factor)
            .toDecimalPlaces(0, rounding);
        return new Money(value, this._currency);
    }

    static create(amount: string, currency: string) {
        const error = checkMinorUnits(amount);

        if (error) {
            return Result.error(error);
        }

        const numericValue = Numeric.create(amount).unwrap();

        const currencyResult = Currency.create(currency);

        if (currencyResult.isError()) {
            return currencyResult.error();
        }

        return Result.ok(new Money(numericValue, currencyResult.unwrap()));
    }

    toString(): string {
        return `${this._amount.toString()} ${this._currency.toString()}`;
    }

    toPlain() {
        return {
            amount: this._amount.toString(),
            currency: this._currency.toString(),
        };
    }
}
