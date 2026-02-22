import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';

const isNegative = (value: number) => value < 0;
const createNegativeError = () =>
    Result.error(
        new DomainError({
            message: 'Step order must be non-negative',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
        })
    );

export function orderIsNonNegative(value: number) {
    return Result.ok<DomainError, number>(value).flatMap(
        ifElse(isNegative, createNegativeError, Result.ok)
    );
}
