import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../../shared/index.ts';

export function checkCurrencyCode(value: string): AppKnownError | null {
    if (!validator.isISO4217(value)) {
        return new AppKnownError({
            message:
                'Expected a valid ISO 4217 currency code, but received: ' +
                value,
            code: KNOWN_ERROR_CODE.CURRENCY_NOT_ISO_4217,
        });
    }

    return null;
}
