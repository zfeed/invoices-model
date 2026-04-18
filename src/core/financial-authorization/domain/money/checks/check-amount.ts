import validator from 'validator';
import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';

export function checkAmountIsInteger(amount: string): AppKnownError | null {
    if (!validator.isInt(amount, { allow_leading_zeroes: false })) {
        return new AppKnownError({
            message: `Invalid minor units. Expected an integer, received: ${amount}`,
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER,
        });
    }

    return null;
}

export function checkAmountIsNonNegative(amount: string): AppKnownError | null {
    if (Number(amount) < 0) {
        return new AppKnownError({
            message: `Invalid minor units. Expected a non-negative integer, received: ${amount}`,
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO,
        });
    }

    return null;
}
