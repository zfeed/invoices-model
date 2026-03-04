import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkEmailFormat } from './checks/check-email-format';

export class Email implements Equatable<Email | string>, Mappable<string> {
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create(value: string) {
        const error = checkEmailFormat(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Email(value.toLowerCase()));
    }

    equals(other: Email | string): boolean {
        if (typeof other === 'string') {
            return this._value === other;
        }
        return this._value === other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
