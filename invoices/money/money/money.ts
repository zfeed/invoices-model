import { Numeric } from '../../numeric/numeric';
import { Currency } from '../currency/currency';
import { ROUNDING } from '../../numeric/rounding';
import { assertMinorUnits } from './asserts/assert-minor-units';

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

    add(other: Money): Money {
        if (!this.#currency.equals(other.currency)) {
            throw new Error(`Cannot add money with different currencies: ${this.#currency} and ${other.currency}`);
        }

        const value = this.#amount.add(other.amount);
    
        return new Money(value, this.#currency);
    }

    multiplyBy(factor: Numeric, rounding: ROUNDING = ROUNDING.UP): Money {
        const value = this.#amount.multiplyBy(factor).toDecimalPlaces(0, rounding);
        return new Money(value, this.#currency);
    }

    static fromString(amount: string, currency: string) {
        const numericValue = Numeric.fromString(amount);
        return Money.fromNumeric(numericValue, new Currency(currency));
    }

    static fromNumeric(amount: Numeric, currency: Currency) {
       assertMinorUnits(amount);

        return new Money(amount, currency);
    }
}
