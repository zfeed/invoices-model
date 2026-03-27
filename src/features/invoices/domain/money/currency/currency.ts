import { Equatable, Result } from '../../../../../shared';
import { checkCurrencyCode } from './checks/check-currency-code';

export class Currency implements Equatable<Currency> {
    protected _code: string;

    protected constructor(code: string) {
        this._code = code;
    }

    static create(code: string) {
        const error = checkCurrencyCode(code);

        if (error) {
            return Result.error(error);
        }
        return Result.ok(new Currency(code));
    }

    equals(other: Currency): boolean {
        return this._code === other._code;
    }

    toString(): string {
        return this._code;
    }
}
