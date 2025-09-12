import { assertUnitQuantity } from "./asserts/assert-unit-quantity";
import { Numeric } from "../numeric/numeric";
import { left, right } from "@sweet-monads/either";

export class UnitQuantity {
    #value: Numeric;

    private constructor(value: Numeric) {
        this.#value = value;
    }

    static create(value: string) {
        const error = assertUnitQuantity(value);

        if (error) {
            return left(error);
        }

        return right(new this(Numeric.create(value)));
    }

    get value(): Numeric {
        return this.#value;
    }

    equals(other: UnitQuantity) {
        return this.#value.equals(other.#value);
    }
}
