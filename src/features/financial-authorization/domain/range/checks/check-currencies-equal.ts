import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { Money } from '../../money/money.ts';

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
