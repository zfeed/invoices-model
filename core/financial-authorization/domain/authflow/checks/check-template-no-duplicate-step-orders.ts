import { ifElse, length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Action } from '../../action/action';
import { Range } from '../../range/range';
import { StepTemplate } from '../../step/step-template';

type AuthflowTemplateInput = {
    action: Action;
    range: Range;
    steps: StepTemplate[];
};

const hasDuplicateOrders = (data: AuthflowTemplateInput) => {
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

export function templateNoDuplicateStepOrders(data: AuthflowTemplateInput) {
    return Result.ok<DomainError, AuthflowTemplateInput>(data).flatMap(
        ifElse(hasDuplicateOrders, createDuplicateOrdersError, Result.ok)
    );
}
