import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkCountryCode } from './checks/check-country-code';

export class Country implements Equatable<Country>, Mappable<string> {
    protected _code: string;

    protected constructor(code: string) {
        this._code = code;
    }

    get code(): string {
        return this._code;
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

    toPlain(): string {
        return this._code;
    }

    toString(): string {
        return this._code;
    }

    equals(other: Country): boolean {
        return this._code === other._code;
    }
}
