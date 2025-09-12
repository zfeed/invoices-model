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

    static create({
        description,
        price,
        quantity
    }: {
        description: string,
        price: {
            amount: string,
            currency: string
        },
        quantity: string
    }) {
        const unitDescription = UnitDescription.create(description);

        const unitQuantityResult = UnitQuantity.create(quantity);

        if (unitQuantityResult.isLeft()) {
            return left(unitQuantityResult.value);
        }

        const moneyResult = Money.create(price.amount, price.currency);

        if (moneyResult.isLeft()) {
            return left(moneyResult.value);
        }

        const unitPrice = moneyResult.unwrap();

        const unitQuantity = unitQuantityResult.unwrap();

        return right(
            new this(
                unitDescription,
                unitPrice,
                unitQuantity
            )
        );
    }
}
