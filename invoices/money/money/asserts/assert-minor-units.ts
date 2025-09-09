import { isInt } from 'validator';
import { Numeric } from '../../../numeric/numeric';

export function assertMinorUnits(units: string | Numeric) {
    if (typeof units === 'string') {
        if (!isInt(units, { min: 0, allow_leading_zeroes: false })) {
            throw new InvalidMinorUnitsError(units);
        }

        return
    }


    if (units.decimalPlaces() > 0 || units.lessThan(Numeric.fromString('0'))) {
        throw new InvalidMinorUnitsError(units.toString());
    }
}

export class InvalidMinorUnitsError extends Error {
    constructor(units: string) {
        super(`Invalid minor units: ${units}`);
    }
}
