import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';

export function checkActionNotBlank(value: string): DomainError | null {
    if (!value.trim()) {
        return new DomainError({
            message: 'Action cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK,
        });
    }

    return null;
}
