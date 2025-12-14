import { length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Step } from '../../step/step';

export function checkNoDuplicateStepOrders(steps: Step[]): DomainError | null {
    // Extract all step orders
    const stepOrders = map(prop('order'), steps);

    // Remove duplicates and compare lengths
    // If uniq removes any items, there were duplicates
    const uniqueOrders = uniq(stepOrders);

    const hasDuplicates = length(stepOrders) !== length(uniqueOrders);

    if (hasDuplicates) {
        return new DomainError({
            message: 'Duplicate step orders found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE,
        });
    }

    return null;
}
