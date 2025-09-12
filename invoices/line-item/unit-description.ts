export class UnitDescription {
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
}
