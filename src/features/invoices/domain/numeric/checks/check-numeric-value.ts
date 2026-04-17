import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../shared/index.ts';

export function checkNumericValue(value: string): AppKnownError | null {
    if (!validator.isDecimal(value)) {
        return new AppKnownError({
            message: `Invalid numeric value: ${value}`,
            code: KNOWN_ERROR_CODE.NUMERIC_INVALID_VALUE,
        });
    }

    return null;
}
