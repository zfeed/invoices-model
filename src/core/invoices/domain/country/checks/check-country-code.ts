import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';

export function checkCountryCode(value: string): AppKnownError | null {
    if (!validator.isISO31661Alpha2(value)) {
        return new AppKnownError({
            message:
                'Expected a valid ISO 3166-1 alpha-2 country code, but received: ' +
                value,
            code: KNOWN_ERROR_CODE.COUNTRY_CODE_NOT_ISO_3166_1_ALPHA_2,
        });
    }

    return null;
}
