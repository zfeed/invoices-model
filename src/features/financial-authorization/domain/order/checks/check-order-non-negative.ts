import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';

export function checkOrderNonNegative(value: number): DomainError | null {
    if (value < 0) {
        return new DomainError({
            message: 'Step order must be non-negative',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
        });
    }

    return null;
}
