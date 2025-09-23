import { isDecimal, isInt } from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../building-blocks';

export function assertPercents(percents: string): DomainError | null {
    if ([isDecimal(percents, { decimal_digits: '0,2' }), isInt(percents)].includes(true) === false) {
        return new DomainError({
            message: `Invalid percentage: ${percents}`,
            code: DOMAIN_ERROR_CODE.VAT_INVALID_PERCENTAGE,
        });
    }

    const numericValue = Number(percents);

    if (numericValue < 0 || numericValue > 100) {
        return new DomainError({
            message: `Invalid percentage range: ${percents}`,
            code: DOMAIN_ERROR_CODE.VAT_INVALID_RANGE,
        });
    }

    return null;
}

