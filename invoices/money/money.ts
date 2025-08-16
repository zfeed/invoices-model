import { Amount } from './amount';
import { Numeric } from '../numeric/numeric';
import { DECIMAL_PLACES } from '../numeric/rounding';
import { Currency } from './currency/currency';
import { CURRENCY_CODE } from './currency/code';

export class Money {
    #amount: Amount;
    #currency: Currency;

    private constructor( amount: Amount,  currency: Currency) {
        this.#amount = amount;
        this.#currency = currency;
    }

    private  static getDecimalPointsBasedOnCurrencyCode(currency: Currency): DECIMAL_PLACES {
        switch (currency.code) {
            case CURRENCY_CODE.USD:
                return DECIMAL_PLACES.TWO;
            case CURRENCY_CODE.JPY:
                return DECIMAL_PLACES.ZERO;
            case CURRENCY_CODE.EUR:
                return DECIMAL_PLACES.TWO;
            case CURRENCY_CODE.BHD:
                return DECIMAL_PLACES.THREE;
            default:
                throw new Error(`Unsupported currency code: ${currency.code}`);
        }
    }

    public get amount(): Amount {
        return this.#amount;
    }

    public get currency(): Currency {
        return this.#currency;
    }


    equals(other: Money): boolean {
        return this.#amount.equals(other.amount) && this.#currency.equals(other.currency);
    }

    static create(amountValue: string, currencyValue: string) {
        const currency = Currency.fromISO4217(currencyValue);
        const decimalPlaces = this.getDecimalPointsBasedOnCurrencyCode(currency);
        const amount = Amount.fromString(amountValue, decimalPlaces);


        return new Money(amount, currency);
    }

    static fromString(amount: string, currency: string) {
        const currencyValue = Currency.fromISO4217(currency);
        const decimalPlaces = this.getDecimalPointsBasedOnCurrencyCode(currencyValue);
        return new Money(Amount.fromString(amount, decimalPlaces), currencyValue);
    }

    static fromNumeric(amount: Numeric, currency: Currency) {
        const decimalPlaces = this.getDecimalPointsBasedOnCurrencyCode(currency);

        if (amount.decimalPlaces !== decimalPlaces) {
            throw new Error(`Amount decimal places (${amount.decimalPlaces}) do not match currency (${decimalPlaces})`);
        }

        return new Money(Amount.fromNumeric(amount), currency);
    }
}
