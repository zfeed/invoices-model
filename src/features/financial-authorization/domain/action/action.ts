import { Equatable, Mappable, Result } from '../../../../shared';
import { checkActionNotBlank } from './checks/check-action-not-blank';

export class Action implements Equatable<Action>, Mappable<string> {
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create(value: string) {
        const error = checkActionNotBlank(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Action(value));
    }

    equals(other: Action): boolean {
        return this._value === other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
