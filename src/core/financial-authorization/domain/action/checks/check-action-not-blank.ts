import { KNOWN_ERROR_CODE } from '../../../../bulding-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../bulding-blocks/errors/app-known-error.ts';

export function checkActionNotBlank(value: string): AppKnownError | null {
    if (!value.trim()) {
        return new AppKnownError({
            message: 'Action cannot be blank',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK,
        });
    }

    return null;
}
