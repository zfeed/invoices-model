export class UnitDescription {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static fromString(value: string) {
        return new this(value);
    }

    equals(other: UnitDescription) {
        return this.#value === other.#value;
    }
}
