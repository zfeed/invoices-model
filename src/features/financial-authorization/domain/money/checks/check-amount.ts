import { isInt } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';

export function checkAmountIsInteger(amount: string): DomainError | null {
    if (!isInt(amount, { allow_leading_zeroes: false })) {
        return new DomainError({
            message: `Invalid minor units. Expected an integer, received: ${amount}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER,
        });
    }

    return null;
}

export function checkAmountIsNonNegative(amount: string): DomainError | null {
    if (Number(amount) < 0) {
        return new DomainError({
            message: `Invalid minor units. Expected a non-negative integer, received: ${amount}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO,
        });
    }

    return null;
}
