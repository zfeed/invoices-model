import { isInt } from "validator";

export function assertUnitQuantity(quantity: string): asserts quantity is string {
    if (!isInt(quantity) || Number(quantity) <= 0) {
        throw new InvalidQuantityError(quantity);
    }
}

export class InvalidQuantityError extends Error {
    constructor(quantity: string) {
        super(`Expected a positive integer for quantity, but received: ${quantity}`);
    }
}
