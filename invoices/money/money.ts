import { Numeric } from '../numeric/numeric';
import { Currency } from './currency/codes/currency';
import { CurrencyFactory } from './currency/factory';
import { ROUNDING } from '../numeric/rounding';

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

    multiplyBy(factor: Numeric): Money {
        const value = this.#amount.multiplyBy(factor).toDecimalPlaces(this.#currency.decimalPlaces.value, ROUNDING.UP);
        return new Money(value, this.#currency);
    }

    static create(amountValue: string, currencyValue: string) {
        const currency = CurrencyFactory.fromISO4217(currencyValue);
        const amount = Numeric.fromString(amountValue, currency.decimalPlaces.value);

        return new Money(amount, currency);
    }

    static fromString(amount: string, currency: string) {
        const currencyValue = CurrencyFactory.fromISO4217(currency);
        const numericValue = Numeric.fromString(amount);
        return new Money(numericValue, currencyValue);
    }

    static fromNumeric(amount: Numeric, currency: Currency) {

        if (amount.decimalPlaces !== currency.decimalPlaces.value) {
            throw new Error(`Amount decimal places (${amount.decimalPlaces}) do not match currency (${currency.decimalPlaces.value})`);
        }
        
        return new Money(amount, currency);
    }
}
