import validator from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';

export function checkEmailFormat(value: string): DomainError | null {
    if (!validator.isEmail(value)) {
        return new DomainError({
            message: 'Invalid email',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
        });
    }

    return null;
}
