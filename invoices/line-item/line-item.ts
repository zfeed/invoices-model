import { UnitDescription } from "./unit-description";
import { UnitQuantity } from "./unit-quantity";
import { Money } from "../money/money/money";
import { Numeric } from "../numeric/numeric";
import { left, right } from "@sweet-monads/either";

export class LineItem {
    #price: Money;
    #description: UnitDescription;
    #quantity: UnitQuantity;

    private constructor(
        description: UnitDescription,
        price: Money,
        quantity: UnitQuantity
    ) {
        this.#description = description;
        this.#price = price;
        this.#quantity = quantity;
    }

    get price(): Money {
        return this.#price;
    }

    get description(): UnitDescription {
        return this.#description;
    }

    get quantity(): UnitQuantity {
        return this.#quantity;
    }

    get total(): Money {
        return this.#price.multiplyBy(this.#quantity.value);
    }

    equals(other: LineItem): boolean {
        return (
            this.#description.equals(other.#description) &&
            this.#price.equals(other.#price) &&
            this.#quantity.equals(other.#quantity)
        );
    }

    static create(description: string, price: Money, quantity: Numeric) {
        const result = UnitQuantity.fromNumeric(quantity);

        if (result.isLeft()) {
            return left(result.value);
        }

        const unitQuantity = result.unwrap();

        return right(
            new this(
                UnitDescription.fromString(description),
                price,
                unitQuantity
            )
        );
    }
}
