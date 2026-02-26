import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Money } from '../../money/money';

export function checkCurrenciesEqual(
    from: Money,
    to: Money
): DomainError | null {
    if (from.currency !== to.currency) {
        return new DomainError({
            message: 'Range currencies must be equal',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL,
        });
    }

    return null;
}
