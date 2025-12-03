import { checkUnitQuantity } from './checks/check-unit-quantity';
import { Numeric } from '../numeric/numeric';
import { Equatable, Result } from '../../building-blocks';

export class UnitQuantity implements Equatable<UnitQuantity> {
    #value: Numeric;

    private constructor(value: Numeric) {
        this.#value = value;
    }

    static create(value: string) {
        const error = checkUnitQuantity(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new this(Numeric.create(value)));
    }

    get value(): Numeric {
        return this.#value;
    }

    equals(other: UnitQuantity) {
        return this.#value.equals(other.#value);
    }
}
