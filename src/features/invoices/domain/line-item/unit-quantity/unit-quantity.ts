import { Equatable, Mappable, Result } from '../../../../../shared/index.ts';
import { Numeric } from '../../numeric/numeric.ts';
import { checkUnitQuantity } from './checks/check-unit-quantity.ts';

export class UnitQuantity implements Equatable<UnitQuantity>, Mappable<string> {
    protected _value: Numeric;

    protected constructor(value: Numeric) {
        this._value = value;
    }

    get value(): Numeric {
        return this._value;
    }

    static create(value: string) {
        const error = checkUnitQuantity(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new UnitQuantity(Numeric.create(value).unwrap()));
    }

    equals(other: UnitQuantity) {
        return this._value.equals(other._value);
    }

    toPlain() {
        return this._value.toString();
    }
}
