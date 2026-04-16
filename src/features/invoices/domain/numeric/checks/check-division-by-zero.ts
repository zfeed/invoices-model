import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared/index.ts';
import { Numeric } from '../numeric.ts';

export function checkDivisionByZero(value: Numeric): DomainError | null {
    if (value.equals(Numeric.create('0').unwrap())) {
        return new DomainError({
            message: 'Division by zero',
            code: DOMAIN_ERROR_CODE.NUMERIC_DIVISION_BY_ZERO,
        });
    }

    return null;
}
