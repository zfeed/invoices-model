import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';

export function checkIdNotBlank(value: string): AppKnownError | null {
    if (!value || !value.trim()) {
        return new AppKnownError({
            message: 'Approver ID cannot be blank',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_ID_BLANK,
        });
    }

    return null;
}
