import validator from 'validator';
import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';

export function checkCurrencyCode(currency: string): AppKnownError | null {
    if (!validator.isISO4217(currency)) {
        return new AppKnownError({
            message: `Expected a valid ISO 4217 currency code, but received: ${currency}`,
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217,
        });
    }

    return null;
}
