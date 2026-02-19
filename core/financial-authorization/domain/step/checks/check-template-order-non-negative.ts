import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { GroupTemplate } from '../../groups/group-template';
import { Order } from '../../order/order';

type StepTemplateInput = {
    order: Order;
    groups: GroupTemplate[];
};

const orderIsNegative = (data: StepTemplateInput) => data.order < 0;
const createOrderNegativeError = () =>
    Result.error(
        new DomainError({
            message: 'Step order must be non-negative',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
        })
    );

export function templateOrderNonNegative(data: StepTemplateInput) {
    return Result.ok<DomainError, StepTemplateInput>(data).flatMap(
        ifElse(orderIsNegative, createOrderNegativeError, Result.ok)
    );
}
