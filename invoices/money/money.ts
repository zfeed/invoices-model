import { Amount } from './amount';
import { Numeric } from '../numeric/numeric';
import { DECIMAL_PLACES } from '../numeric/rounding';
import { Currency } from './currency/codes/currency';
import { CurrencyFactory } from './currency/factory';

export class Money {
    #amount: Amount;
    #currency: Currency;

    private constructor( amount: Amount,  currency: Currency) {
        this.#amount = amount;
        this.#currency = currency;
    }

    public get amount(): Amount {
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

    static create(amountValue: string, currencyValue: string) {
        const currency = CurrencyFactory.fromISO4217(currencyValue);
        const amount = Amount.fromString(amountValue, currency.decimalPlaces.value);



        return new Money(amount, currency);
    }

    static fromString(amount: string, currency: string) {
        const currencyValue = CurrencyFactory.fromISO4217(currency);
        return new Money(Amount.fromString(amount, currencyValue.decimalPlaces.value), currencyValue);
    }

    static fromNumeric(amount: Numeric, currency: Currency) {

        if (amount.decimalPlaces !== currency.decimalPlaces.value) {
            throw new Error(`Amount decimal places (${amount.decimalPlaces}) do not match currency (${currency.decimalPlaces.value})`);
        }
        
        return new Money(Amount.fromNumeric(amount), currency);
    }
}
