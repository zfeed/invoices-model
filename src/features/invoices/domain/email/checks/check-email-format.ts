import { isEmail } from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared';

export function checkEmailFormat(value: string): DomainError | null {
    if (!isEmail(value)) {
        return new DomainError({
            message: 'Expected a valid email format, but received: ' + value,
            code: DOMAIN_ERROR_CODE.EMAIL_INVALID_FORMAT,
        });
    }

    return null;
}
