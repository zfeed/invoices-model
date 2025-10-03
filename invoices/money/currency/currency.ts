import { checkCurrencyCode } from './checks/check-currency-code';
import { Result } from '../../../building-blocks';

export class Currency {
    #code: string;

    private constructor(code: string) {
        this.#code = code;
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
