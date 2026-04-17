import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';
import { Money } from '../../money/money.ts';

export function checkCurrenciesEqual(
    from: Money,
    to: Money
): AppKnownError | null {
    if (from.currency !== to.currency) {
        return new AppKnownError({
            message: 'Range currencies must be equal',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL,
        });
    }

    return null;
}
