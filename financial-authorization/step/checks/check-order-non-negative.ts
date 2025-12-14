import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';

export function checkOrderNonNegative(order: number): DomainError | null {
    if (order < 0) {
        return new DomainError({
            message: 'Step order must be non-negative',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
        });
    }

    return null;
}

