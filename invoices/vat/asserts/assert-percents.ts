import { isDecimal, isInt } from 'validator';

export function assertPercents(percents: string) {
    if ([isDecimal(percents, { decimal_digits: '0,2' }), isInt(percents)].includes(true) === false) {
        throw new InvalidPercentsError(percents);
    }

    const numericValue = Number(percents);

    if (numericValue < 0 || numericValue > 100) {
        throw new InvalidPercentsError(percents);
    }
}

export class InvalidPercentsError extends Error {
    constructor(value: string) {
        super(`Invalid percentage: ${value}`);
    }
}
