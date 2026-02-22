import { Equatable, Result } from '../../../../../building-blocks';
import { checkCurrencyCode } from './checks/check-currency-code';

export class Currency implements Equatable<Currency> {
    #code: string;

    protected constructor(code: string) {
        this.#code = code;
    }

    static fromPlain(code: string) {
        return new Currency(code);
    }

    static create(code: string) {
        const error = checkCurrencyCode(code);

        if (error) {
            return Result.error(error);
        }
        return Result.ok(new Currency(code));
    }

    equals(other: Currency): boolean {
        return this.#code === other.#code;
    }

    toString(): string {
        return this.#code;
    }
}
