import { Decimal } from 'decimal.js';
import { Comparable, DomainError, Equatable, Result } from '../../../../shared';
import { checkDivisionByZero } from './checks/check-division-by-zero';
import { checkNumericValue } from './checks/check-numeric-value';
import { ROUNDING } from './rounding';

export class Numeric implements Equatable<Numeric>, Comparable<Numeric> {
    protected _value: Decimal;
    protected constructor(value: string) {
        this._value = new Decimal(value);
    }

    static create(value: string): Result<DomainError, Numeric> {
        const error = checkNumericValue(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Numeric(value));
    }

    multiplyBy(value: Numeric): Numeric {
        return new Numeric(this._value.mul(value._value).toString());
    }

    add(value: Numeric): Numeric {
        return new Numeric(this._value.add(value._value).toString());
    }

    subtract(value: Numeric): Numeric {
        return new Numeric(this._value.sub(value._value).toString());
    }

    divideBy(value: Numeric): Result<DomainError, Numeric> {
        const error = checkDivisionByZero(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Numeric(this._value.div(value._value).toString()));
    }

    toDecimalPlaces(places: number, rounding: ROUNDING = ROUNDING.UP): Numeric {
        return new Numeric(
            this._value.toDecimalPlaces(places, rounding).toString()
        );
    }

    decimalPlaces(): number {
        return this._value.decimalPlaces();
    }

    greaterThan(value: Numeric) {
        return this._value.gt(value._value);
    }

    lessThan(value: Numeric) {
        return this._value.lt(value._value);
    }

    greaterThanEqual(value: Numeric) {
        return this._value.gte(value._value);
    }

    lessThanEqual(value: Numeric) {
        return this._value.lte(value._value);
    }

    equals(value: Numeric) {
        return this._value.equals(value._value);
    }

    toString() {
        return this._value.toString();
    }
}
