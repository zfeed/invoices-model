import { KNOWN_ERROR_CODE } from '../../../../bulding-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../bulding-blocks/errors/app-known-error.ts';

export function checkOrderNonNegative(value: number): AppKnownError | null {
    if (value < 0) {
        return new AppKnownError({
            message: 'Step order must be non-negative',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
        });
    }

    return null;
}
