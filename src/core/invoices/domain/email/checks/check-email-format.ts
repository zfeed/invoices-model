import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../shared/index.ts';

export function checkEmailFormat(value: string): AppKnownError | null {
    if (!validator.isEmail(value)) {
        return new AppKnownError({
            message: 'Expected a valid email format, but received: ' + value,
            code: KNOWN_ERROR_CODE.EMAIL_INVALID_FORMAT,
        });
    }

    return null;
}
