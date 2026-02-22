import { Equatable, Mappable } from '../../../../building-blocks';

export class UnitDescription implements Equatable<UnitDescription>, Mappable<string> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static create(value: string) {
        return new UnitDescription(value);
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
