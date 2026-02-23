import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';

export function checkReferenceIdNotBlank(value: string): DomainError | null {
    if (!value.trim()) {
        return new DomainError({
            message: 'Reference ID cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK,
        });
    }

    return null;
}
