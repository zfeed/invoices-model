import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';

export function checkNameNotBlank(value: string): DomainError | null {
    if (!value.trim()) {
        return new DomainError({
            message: 'Name cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK,
        });
    }

    return null;
}
