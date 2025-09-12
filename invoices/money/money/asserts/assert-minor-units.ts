import { isInt } from "validator";
import { Numeric } from "../../../numeric/numeric";
import { DomainError, DOMAIN_ERROR_CODE } from "../../../../building-blocks";

export function assertMinorUnits(units: string | Numeric): DomainError | null {
    const minorUnitsNotIntegerError = new DomainError({
        message: `Invalid minor units. Expected an integer, received: ${units}`,
        code: DOMAIN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER,
    });

    const minorUnitsNotGteZeroError = new DomainError({
        message: `Invalid minor units. Expected a non-negative integer, received: ${units}`,
        code: DOMAIN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO,
    });

    if (typeof units === "string") {
        if (!isInt(units, { allow_leading_zeroes: false })) {
            return minorUnitsNotIntegerError;
        }

        if (Number(units) < 0) {
            return minorUnitsNotGteZeroError;
        }

        return null;
    }

    if (units.decimalPlaces() > 0) {
        return minorUnitsNotIntegerError;
    }

    if (units.lessThan(Numeric.create("0"))) {
        return minorUnitsNotGteZeroError;
    }

    return null;
}
