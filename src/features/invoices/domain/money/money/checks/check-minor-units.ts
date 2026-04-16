import validator from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../../shared/index.ts';
import { Numeric } from '../../../numeric/numeric.ts';

const ZERO = Numeric.create('0').unwrap();

export function checkMinorUnits(units: string | Numeric): DomainError | null {
    if (typeof units === 'string') {
        if (!validator.isInt(units, { allow_leading_zeroes: false })) {
            return new DomainError({
                message: `Invalid minor units. Expected an integer, received: ${units}`,
                code: DOMAIN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER,
            });
        }

        if (Number(units) < 0) {
            return new DomainError({
                message: `Invalid minor units. Expected a non-negative integer, received: ${units}`,
                code: DOMAIN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO,
            });
        }

        return null;
    }

    if (units.decimalPlaces() > 0) {
        return new DomainError({
            message: `Invalid minor units. Expected an integer, received: ${units}`,
            code: DOMAIN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER,
        });
    }

    if (units.lessThan(ZERO)) {
        return new DomainError({
            message: `Invalid minor units. Expected a non-negative integer, received: ${units}`,
            code: DOMAIN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO,
        });
    }

    return null;
}
