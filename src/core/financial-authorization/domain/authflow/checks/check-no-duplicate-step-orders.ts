import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Step } from '../../step/step';

export function checkNoDuplicateStepOrders(steps: Step[]): DomainError | null {
    const orders = steps.map((s) => s.order.toPlain());
    const uniqueOrders = new Set(orders);

    if (orders.length !== uniqueOrders.size) {
        return new DomainError({
            message: 'Duplicate step orders found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE,
        });
    }

    return null;
}
