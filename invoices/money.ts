import { Amount } from './amount';
import { Currency } from './currency';

export class Money {
    private constructor(public amount: Amount, public currency: Currency) {}

    static create(amountValue: string, currencyValue: string) {
        const amount = Amount.fromString(amountValue);
        const currency = Currency.fromISO4217(currencyValue);

        return new Money(amount, currency);
    }

    static fromAmount(amount: Amount, currency: Currency) {
        return new Money(amount, currency);
    }
}
