import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkCountryCode } from './checks/check-country-code';

export class Country implements Equatable<Country>, Mappable<string> {
    #code: string;

    protected constructor(code: string) {
        this.#code = code;
    }

    static fromPlain(code: string) {
        return new Country(code);
    }

    static create(code: string) {
        const error = checkCountryCode(code);

        if (error) {
            return Result.error(error);
        }
        return Result.ok(new Country(code.toUpperCase()));
    }

    get code(): string {
        return this.#code;
    }

    toPlain(): string {
        return this.#code;
    }

    toString(): string {
        return this.#code;
    }

    equals(other: Country): boolean {
        return this.#code === other.#code;
    }
}
