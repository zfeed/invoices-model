import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';

export function checkNameNotBlank(value: string): DomainError | null {
    if (!value.trim()) {
        return new DomainError({
            message: 'Name cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK,
        });
    }

    return null;
}
