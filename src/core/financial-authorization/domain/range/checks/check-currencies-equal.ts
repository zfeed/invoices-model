import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Money } from '../../money/money';

type RangeInput = {
    from: Money;
    to: Money;
};

const currenciesNotEqual = (data: RangeInput) =>
    data.from.currency !== data.to.currency;

const createCurrenciesNotEqualError = () =>
    Result.error(
        new DomainError({
            message: 'Range currencies must be equal',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL,
        })
    );

export function currenciesEqual(data: RangeInput) {
    return Result.ok<DomainError, RangeInput>(data).flatMap(
        ifElse(currenciesNotEqual, createCurrenciesNotEqualError, Result.ok)
    );
}
