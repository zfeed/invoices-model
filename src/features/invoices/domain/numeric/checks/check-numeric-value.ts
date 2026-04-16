import validator from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared/index.ts';

export function checkNumericValue(value: string): DomainError | null {
    if (!validator.isDecimal(value)) {
        return new DomainError({
            message: `Invalid numeric value: ${value}`,
            code: DOMAIN_ERROR_CODE.NUMERIC_INVALID_VALUE,
        });
    }

    return null;
}
