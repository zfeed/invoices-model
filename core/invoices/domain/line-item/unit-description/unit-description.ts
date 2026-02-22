import { Equatable, Mappable, Result } from '../../../../../building-blocks';
import { checkDescriptionNonEmpty } from './checks/check-description-non-empty';

export class UnitDescription implements Equatable<UnitDescription>, Mappable<string> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static create(value: string) {
        const error = checkDescriptionNonEmpty(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new UnitDescription(value));
    }

    static fromPlain(value: string) {
        return new UnitDescription(value);
    }

    equals(other: UnitDescription) {
        return this.#value === other.#value;
    }

    toPlain(): string {
        return this.#value;
    }

    toString(): string {
        return this.#value;
    }
}
