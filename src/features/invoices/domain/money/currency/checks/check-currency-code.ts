import validator from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../../shared/index.ts';

export function checkCurrencyCode(value: string): DomainError | null {
    if (!validator.isISO4217(value)) {
        return new DomainError({
            message:
                'Expected a valid ISO 4217 currency code, but received: ' +
                value,
            code: DOMAIN_ERROR_CODE.CURRENCY_NOT_ISO_4217,
        });
    }

    return null;
}
