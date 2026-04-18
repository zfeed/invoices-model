import { Equatable, Mappable, Result } from '../../../building-blocks/index.ts';
import { checkOrderNonNegative } from './checks/check-order-non-negative.ts';

export class Order implements Equatable<Order>, Mappable<number> {
    protected _value: number;

    protected constructor(value: number) {
        this._value = value;
    }

    static create(value: number) {
        const error = checkOrderNonNegative(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Order(value));
    }

    equals(other: Order): boolean {
        return this._value === other._value;
    }

    toPlain(): number {
        return this._value;
    }

    toString(): string {
        return String(this._value);
    }
}
