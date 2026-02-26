import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Money } from '../../money/money';

export function checkFromNotGreaterThanTo(
    from: Money,
    to: Money
): DomainError | null {
    if (Number(from.amount) > Number(to.amount)) {
        return new DomainError({
            message: 'Range from must be less than or equal to to',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO,
        });
    }

    return null;
}
