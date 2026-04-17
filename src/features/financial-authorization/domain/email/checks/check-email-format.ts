import validator from 'validator';
import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';

export function checkEmailFormat(value: string): AppKnownError | null {
    if (!validator.isEmail(value)) {
        return new AppKnownError({
            message: 'Invalid email',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
        });
    }

    return null;
}
