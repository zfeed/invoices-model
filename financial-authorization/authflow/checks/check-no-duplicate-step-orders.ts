import { ifElse, length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Step } from '../../step/step';

type AuthflowInput = {
    action: string;
    steps: Step[];
};

const hasDuplicateOrders = (data: AuthflowInput) => {
    const stepOrders = map(prop('order'), data.steps);
    const uniqueOrders = uniq(stepOrders);
    return length(stepOrders) !== length(uniqueOrders);
};

const createDuplicateOrdersError = () =>
    Result.error(
        new DomainError({
            message: 'Duplicate step orders found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE,
        })
    );

export function noDuplicateStepOrders(data: AuthflowInput) {
    return Result.ok<DomainError, AuthflowInput>(data).flatMap(
        ifElse(hasDuplicateOrders, createDuplicateOrdersError, Result.ok)
    );
}
