import { Amount } from './amount';
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

    private constructor(amount: Amount,  currency: Currency) {
        this.#amount = amount;
        this.#currency = currency;
    }

    static create(amountValue: string, currencyValue: string) {
        const amount = Amount.fromString(amountValue);
        const currency = Currency.fromISO4217(currencyValue);

        return new Money(amount, currency);
    }

    static fromAmount(amount: Amount, currency: Currency) {
        return new Money(amount, currency);
    }
}
