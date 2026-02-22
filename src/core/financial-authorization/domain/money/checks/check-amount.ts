import { ifElse } from 'ramda';
import { isInt } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';

type MoneyInput = {
    amount: string;
    currency: string;
};

const amountNotInteger = (data: MoneyInput) =>
    !isInt(data.amount, { allow_leading_zeroes: false });

const createAmountNotIntegerError = (data: MoneyInput) =>
    Result.error(
        new DomainError({
            message: `Invalid minor units. Expected an integer, received: ${data.amount}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER,
        })
    );

export function amountIsInteger(data: MoneyInput) {
    return Result.ok<DomainError, MoneyInput>(data).flatMap(
        ifElse(amountNotInteger, createAmountNotIntegerError, Result.ok)
    );
}

const amountNegative = (data: MoneyInput) => Number(data.amount) < 0;

const createAmountNegativeError = (data: MoneyInput) =>
    Result.error(
        new DomainError({
            message: `Invalid minor units. Expected a non-negative integer, received: ${data.amount}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO,
        })
    );

export function amountIsNonNegative(data: MoneyInput) {
    return Result.ok<DomainError, MoneyInput>(data).flatMap(
        ifElse(amountNegative, createAmountNegativeError, Result.ok)
    );
}
