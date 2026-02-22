import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Money } from '../../money/money';

type RangeInput = {
    from: Money;
    to: Money;
};

const fromGreaterThanTo = (data: RangeInput) =>
    Number(data.from.amount) > Number(data.to.amount);

const createFromGreaterThanToError = () =>
    Result.error(
        new DomainError({
            message: 'Range from must be less than or equal to to',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO,
        })
    );

export function fromNotGreaterThanTo(data: RangeInput) {
    return Result.ok<DomainError, RangeInput>(data).flatMap(
        ifElse(fromGreaterThanTo, createFromGreaterThanToError, Result.ok)
    );
}
