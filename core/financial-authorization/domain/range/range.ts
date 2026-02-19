import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Money } from '../money/money';
import { currenciesEqual } from './checks/check-currencies-equal';
import { fromNotGreaterThanTo } from './checks/check-from-not-greater-than-to';

export type Range = {
    from: Money;
    to: Money;
};

type RangeInput = {
    from: Money;
    to: Money;
};

const buildRange = applySpec<Range>({
    from: prop('from'),
    to: prop('to'),
});

export const createRange = (
    from: Money,
    to: Money
): Result<DomainError, Range> =>
    Result.ok<DomainError, RangeInput>({ from, to })
        .flatMap(currenciesEqual)
        .flatMap(fromNotGreaterThanTo)
        .map(buildRange);
