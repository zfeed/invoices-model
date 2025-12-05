import { Equatable } from '../../../building-blocks';

export class UnitDescription implements Equatable<UnitDescription> {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(value: string) {
        return new this(value);
    }

    equals(other: UnitDescription) {
        return this.#value === other.#value;
    }

    toString(): string {
        return this.#value;
    }
}
