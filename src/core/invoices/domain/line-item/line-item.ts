import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Money } from '../money/money/money';
import { UnitDescription } from './unit-description/unit-description';
import { UnitQuantity } from './unit-quantity/unit-quantity';

export class LineItem
    implements Equatable<LineItem>, Mappable<ReturnType<LineItem['toPlain']>>
{
    protected _price: Money;
    protected _description: UnitDescription;
    protected _quantity: UnitQuantity;
    protected _total: Money;

    protected constructor(
        description: UnitDescription,
        price: Money,
        quantity: UnitQuantity,
        total: Money
    ) {
        this._description = description;
        this._price = price;
        this._quantity = quantity;
        this._total = total;
    }

    get price(): Money {
        return this._price;
    }

    get description(): UnitDescription {
        return this._description;
    }

    get quantity(): UnitQuantity {
        return this._quantity;
    }

    get total(): Money {
        return this._total;
    }

    equals(other: LineItem): boolean {
        return (
            this._description.equals(other._description) &&
            this._price.equals(other._price) &&
            this._quantity.equals(other._quantity)
        );
    }

    toPlain() {
        return {
            description: this._description.toPlain(),
            price: this._price.toPlain(),
            quantity: this._quantity.toPlain(),
            total: this._total.toPlain(),
        };
    }

    static fromPlain(plain: ReturnType<LineItem['toPlain']>) {
        return new LineItem(
            UnitDescription.fromPlain(plain.description),
            Money.fromPlain(plain.price),
            UnitQuantity.fromPlain(plain.quantity),
            Money.fromPlain(plain.total)
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
        const unitDescriptionResult = UnitDescription.create(description);

        if (unitDescriptionResult.isError()) {
            return unitDescriptionResult.error();
        }

        const unitQuantityResult = UnitQuantity.create(quantity);

        if (unitQuantityResult.isError()) {
            return unitQuantityResult.error();
        }

        const moneyResult = Money.create(price.amount, price.currency);

        if (moneyResult.isError()) {
            return moneyResult.error();
        }

        const unitDescription = unitDescriptionResult.unwrap();
        const unitPrice = moneyResult.unwrap();
        const unitQuantity = unitQuantityResult.unwrap();

        const unitTotal = unitPrice.multiplyBy(unitQuantity.value);

        return Result.ok(
            new LineItem(unitDescription, unitPrice, unitQuantity, unitTotal)
        );
    }
}
