import { isDecimal } from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared';

export function checkNumericValue(value: string): DomainError | null {
    if (!isDecimal(value)) {
        return new DomainError({
            message: `Invalid numeric value: ${value}`,
            code: DOMAIN_ERROR_CODE.NUMERIC_INVALID_VALUE,
        });
    }

    return null;
}
