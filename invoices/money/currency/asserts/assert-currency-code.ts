import { isISO4217 } from 'validator';

export function assertCurrencyCode(value: string): asserts value is string {
    if (!isISO4217(value)) {
        throw new InvalidCurrencyCodeError(value);
    }
}

export class InvalidCurrencyCodeError extends Error {
    constructor(value: string) {
        super(`Expected a valid ISO 4217 currency code, but received: ${value}`);
    }
}
