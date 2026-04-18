import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';
import { Step } from '../../step/step.ts';

export function checkNoDuplicateStepOrders(
    steps: Step[]
): AppKnownError | null {
    const orders = steps.map((s) => s.order.toPlain());
    const uniqueOrders = new Set(orders);

    if (orders.length !== uniqueOrders.size) {
        return new AppKnownError({
            message: 'Duplicate step orders found',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE,
        });
    }

    return null;
}
