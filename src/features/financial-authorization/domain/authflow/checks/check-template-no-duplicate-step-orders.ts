import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';
import { StepTemplate } from '../../step/step-template';

export function checkTemplateNoDuplicateStepOrders(
    steps: StepTemplate[]
): DomainError | null {
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
