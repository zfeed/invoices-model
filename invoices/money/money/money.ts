import { Numeric } from '../../numeric/numeric';
import { Currency } from '../currency/currency';
import { ROUNDING } from '../../numeric/rounding';
import { assertMinorUnits } from './asserts/assert-minor-units';
import { assertEqualCurrencies } from './asserts/assert-equal-currencies';
import { Result } from "../../../building-blocks";

export class Money {
    #amount: Numeric;
    #currency: Currency;

    private constructor( amount: Numeric,  currency: Currency) {
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
        const error = assertEqualCurrencies(this.#currency, other.currency);

        if (error) {
            return Result.error(error);
        }

        const value = this.#amount.add(other.amount);

        return Result.ok(new Money(value, this.#currency));
    }

    multiplyBy(factor: Numeric, rounding: ROUNDING = ROUNDING.UP): Money {
        const value = this.#amount.multiplyBy(factor).toDecimalPlaces(0, rounding);
        return new Money(value, this.#currency);
    }


    static create(amount: string, currency: string) {
       const error = assertMinorUnits(amount);

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
}
