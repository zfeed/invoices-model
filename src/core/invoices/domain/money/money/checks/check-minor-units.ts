import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../../shared/index.ts';
import { Numeric } from '../../../numeric/numeric.ts';

const ZERO = Numeric.create('0').unwrap();

export function checkMinorUnits(units: string | Numeric): AppKnownError | null {
    if (typeof units === 'string') {
        if (!validator.isInt(units, { allow_leading_zeroes: false })) {
            return new AppKnownError({
                message: `Invalid minor units. Expected an integer, received: ${units}`,
                code: KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER,
            });
        }

        if (Number(units) < 0) {
            return new AppKnownError({
                message: `Invalid minor units. Expected a non-negative integer, received: ${units}`,
                code: KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO,
            });
        }

        return null;
    }

    if (units.decimalPlaces() > 0) {
        return new AppKnownError({
            message: `Invalid minor units. Expected an integer, received: ${units}`,
            code: KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER,
        });
    }

    if (units.lessThan(ZERO)) {
        return new AppKnownError({
            message: `Invalid minor units. Expected a non-negative integer, received: ${units}`,
            code: KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO,
        });
    }

    return null;
}
