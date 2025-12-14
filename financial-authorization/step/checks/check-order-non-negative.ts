import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Group } from '../../groups/group';

type StepInput = {
    order: number;
    groups: Group[];
};

const orderIsNegative = (data: StepInput) => data.order < 0;
const createOrderNegativeError = () =>
    Result.error(
        new DomainError({
            message: 'Step order must be non-negative',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
        })
    );

export function orderNonNegative(data: StepInput) {
    return Result.ok<DomainError, StepInput>(data).flatMap(
        ifElse(orderIsNegative, createOrderNegativeError, Result.ok)
    );
}
