import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../building-blocks';
import { Numeric } from '../numeric';

export function checkDivisionByZero(value: Numeric): DomainError | null {
    if (value.equals(Numeric.create('0').unwrap())) {
        return new DomainError({
            message: 'Division by zero',
            code: DOMAIN_ERROR_CODE.NUMERIC_DIVISION_BY_ZERO,
        });
    }

    return null;
}
