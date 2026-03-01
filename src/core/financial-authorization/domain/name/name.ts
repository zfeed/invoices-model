import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkNameNotBlank } from './checks/check-name-not-blank';

export class Name implements Equatable<Name>, Mappable<string> {
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create(value: string) {
        const error = checkNameNotBlank(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Name(value));
    }

    static fromPlain(value: string) {
        return new Name(value);
    }

    equals(other: Name): boolean {
        return this._value === other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
