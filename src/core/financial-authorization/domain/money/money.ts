import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkAmountIsInteger, checkAmountIsNonNegative } from './checks/check-amount';
import { checkCurrencyCode } from './checks/check-currency-code';

export class Money implements Equatable<Money>, Mappable<ReturnType<Money['toPlain']>> {
    #amount: string;
    #currency: string;

    protected constructor(amount: string, currency: string) {
        this.#amount = amount;
        this.#currency = currency;
    }

    public get amount(): string {
        return this.#amount;
    }

    public get currency(): string {
        return this.#currency;
    }

    static create(amount: string, currency: string) {
        const intError = checkAmountIsInteger(amount);
        if (intError) {
            return Result.error(intError);
        }

        const nonNegError = checkAmountIsNonNegative(amount);
        if (nonNegError) {
            return Result.error(nonNegError);
        }

        const currError = checkCurrencyCode(currency);
        if (currError) {
            return Result.error(currError);
        }

        return Result.ok(new Money(amount, currency));
    }

    static fromPlain(plain: { amount: string; currency: string }) {
        return new Money(plain.amount, plain.currency);
    }

    equals(other: Money): boolean {
        return this.#amount === other.#amount && this.#currency === other.#currency;
    }

    toPlain() {
        return {
            amount: this.#amount,
            currency: this.#currency,
        };
    }

    toString(): string {
        return `${this.#amount} ${this.#currency}`;
    }
}
