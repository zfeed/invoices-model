import { isISO31661Alpha2 } from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../../../building-blocks';

export function checkBankCountry(value: string): DomainError | null {
    if (!isISO31661Alpha2(value)) {
        return new DomainError({
            message:
                'Expected a valid ISO 3166-1 alpha-2 country code for bank country, but received: ' +
                value,
            code: DOMAIN_ERROR_CODE.WIRE_INVALID_BANK_COUNTRY,
        });
    }

    return null;
}
