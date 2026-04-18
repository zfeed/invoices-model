import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';
import { Numeric } from '../numeric.ts';

export function checkDivisionByZero(value: Numeric): AppKnownError | null {
    if (value.equals(Numeric.create('0').unwrap())) {
        return new AppKnownError({
            message: 'Division by zero',
            code: KNOWN_ERROR_CODE.NUMERIC_DIVISION_BY_ZERO,
        });
    }

    return null;
}
