import { Result } from '../../building-blocks';
import { checkCountryCode } from './checks/check-country-code';

export class Country {
    #code: string;

    private constructor(code: string) {
        this.#code = code;
    }

    static create({ code }: { code: string }) {
        const error = checkCountryCode(code);

        if (error) {
            return Result.error(error);
        }
        return Result.ok(new Country(code));
    }

    get code(): string {
        return this.#code;
    }

    toString(): string {
        return this.#code;
    }

    equals(other: Country): boolean {
        return this.#code === other.#code;
    }
}
