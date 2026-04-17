import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../shared/index.ts';

export function checkPercents(percents: string): AppKnownError | null {
    if (
        [
            validator.isDecimal(percents, { decimal_digits: '0,2' }),
            validator.isInt(percents),
        ].includes(true) === false
    ) {
        return new AppKnownError({
            message: `Invalid percentage: ${percents}`,
            code: KNOWN_ERROR_CODE.VAT_INVALID_PERCENTAGE,
        });
    }

    const numericValue = Number(percents);

    if (numericValue < 0 || numericValue > 100) {
        return new AppKnownError({
            message: `Invalid percentage range: ${percents}`,
            code: KNOWN_ERROR_CODE.VAT_INVALID_RANGE,
        });
    }

    return null;
}
