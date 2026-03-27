import { Equatable, Mappable, Result } from '../../../../../shared';
import { checkDescriptionNonEmpty } from './checks/check-description-non-empty';

export class UnitDescription
    implements Equatable<UnitDescription>, Mappable<string>
{
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create(value: string) {
        const error = checkDescriptionNonEmpty(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new UnitDescription(value));
    }

    equals(other: UnitDescription) {
        return this._value === other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
