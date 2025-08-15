import { Amount } from './amount';
import { Numeric } from './numeric/numeric';
import { Currency } from './currency';

export class Money {
    #amount: Amount;
    #currency: Currency;

    public get amount(): Amount {
        return this.#amount;
    }

    public get currency(): Currency {
        return this.#currency;
    }

    private constructor( amount: Amount,  currency: Currency) {
        this.#amount = amount;
        this.#currency = currency;
    }

    equals(other: Money): boolean {
        return this.#amount.equals(other.amount) && this.#currency.equals(other.currency);
    }

    static create(amountValue: string, currencyValue: string) {
        const amount = Amount.fromString(amountValue);
        const currency = Currency.fromISO4217(currencyValue);

        return new Money(amount, currency);
    }

    static fromString(amount: string, currency: string) {
        return new Money(Amount.fromString(amount), Currency.fromISO4217(currency));
    }

    static fromNumeric(amount: Numeric, currency: Currency) {
        return new Money(Amount.fromNumeric(amount), currency);
    }
}
