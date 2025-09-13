import { UnitDescription } from "./unit-description";
import { UnitQuantity } from "./unit-quantity";
import { Money } from "../money/money/money";
import { Result } from "../../building-blocks";

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

        if (unitQuantityResult.isError()) {
            return unitQuantityResult.error();
        }

        const moneyResult = Money.create(price.amount, price.currency);

        if (moneyResult.isError()) {
            return moneyResult.error();
        }

        const unitPrice = moneyResult.unwrap();

        const unitQuantity = unitQuantityResult.unwrap();

        return Result.ok(
            new this(
                unitDescription,
                unitPrice,
                unitQuantity
            )
        );
    }
}
