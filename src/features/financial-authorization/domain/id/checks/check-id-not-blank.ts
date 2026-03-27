import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';

export function checkIdNotBlank(value: string): DomainError | null {
    if (!value || !value.trim()) {
        return new DomainError({
            message: 'Approver ID cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_ID_BLANK,
        });
    }

    return null;
}
