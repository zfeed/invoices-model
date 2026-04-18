import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';
import { Money } from '../../money/money.ts';

export function checkFromNotGreaterThanTo(
    from: Money,
    to: Money
): AppKnownError | null {
    if (Number(from.amount) > Number(to.amount)) {
        return new AppKnownError({
            message: 'Range from must be less than or equal to to',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO,
        });
    }

    return null;
}
