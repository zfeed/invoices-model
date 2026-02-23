import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkOrderNonNegative } from './checks/check-order-non-negative';

export class Order implements Equatable<Order>, Mappable<number> {
    #value: number;

    protected constructor(value: number) {
        this.#value = value;
    }

    static create(value: number) {
        const error = checkOrderNonNegative(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Order(value));
    }

    static fromPlain(value: number) {
        return new Order(value);
    }

    equals(other: Order): boolean {
        return this.#value === other.#value;
    }

    toPlain(): number {
        return this.#value;
    }

    toString(): string {
        return String(this.#value);
    }
}
