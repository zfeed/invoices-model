import { isISO31661Alpha2 } from 'validator';
import { DomainError, DOMAIN_ERROR_CODE } from '../../../building-blocks';

export function checkCountryCode(value: string): DomainError | null {
    if (!isISO31661Alpha2(value)) {
        return new DomainError({
            message:
                'Expected a valid ISO 3166-1 alpha-2 country code, but received: ' +
                value,
            code: DOMAIN_ERROR_CODE.COUNTRY_CODE_NOT_ISO_3166_1_ALPHA_2,
        });
    }

    return null;
}
