import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Money } from '../money/money/money';
import { UnitDescription } from './unit-description';
import { UnitQuantity } from './unit-quantity/unit-quantity';

export class LineItem implements Equatable<LineItem>, Mappable<ReturnType<LineItem['toPlain']>> {
    #price: Money;
    #description: UnitDescription;
    #quantity: UnitQuantity;
    #total: Money;

    protected constructor(
        description: UnitDescription,
        price: Money,
        quantity: UnitQuantity,
        total: Money
    ) {
        this.#description = description;
        this.#price = price;
        this.#quantity = quantity;
        this.#total = total;
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
        return this.#total;
    }

    equals(other: LineItem): boolean {
        return (
            this.#description.equals(other.#description) &&
            this.#price.equals(other.#price) &&
            this.#quantity.equals(other.#quantity)
        );
    }

    toPlain() {
        return {
            description: this.#description.toPlain(),
            price: this.#price.toPlain(),
            quantity: this.#quantity.toPlain(),
            total: this.#total.toPlain(),
        };
    }

    static fromPlain(plain: ReturnType<LineItem['toPlain']>) {
        return new this(
            UnitDescription.fromPlain(plain.description),
            Money.fromPlain(plain.price),
            UnitQuantity.fromPlain(plain.quantity),
            Money.fromPlain(plain.total),
        );
    }

    static create({
        description,
        price,
        quantity,
    }: {
        description: string;
        price: {
            amount: string;
            currency: string;
        };
        quantity: string;
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

        const unitTotal = unitPrice.multiplyBy(unitQuantity.value);

        return Result.ok(
            new this(unitDescription, unitPrice, unitQuantity, unitTotal)
        );
    }
}
