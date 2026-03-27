import { isEmail } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';

export function checkEmailFormat(value: string): DomainError | null {
    if (!isEmail(value)) {
        return new DomainError({
            message: 'Invalid email',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
        });
    }

    return null;
}
