import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { StepTemplate } from '../../step/step-template.ts';

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
