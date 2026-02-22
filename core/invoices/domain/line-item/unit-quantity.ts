import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Numeric } from '../numeric/numeric';
import { checkUnitQuantity } from './checks/check-unit-quantity';

export class UnitQuantity implements Equatable<UnitQuantity>, Mappable<string> {
    #value: Numeric;

    protected constructor(value: Numeric) {
        this.#value = value;
    }

    static fromPlain(value: string) {
        return new this(Numeric.create(value).unwrap());
    }

    static create(value: string) {
        const error = checkUnitQuantity(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new this(Numeric.create(value).unwrap()));
    }

    get value(): Numeric {
        return this.#value;
    }

    equals(other: UnitQuantity) {
        return this.#value.equals(other.#value);
    }

    toPlain() {
        return this.#value.toString();
    }
}
