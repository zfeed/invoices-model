import { isISO4217 } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';

export function checkCurrencyCode(currency: string): DomainError | null {
    if (!isISO4217(currency)) {
        return new DomainError({
            message: `Expected a valid ISO 4217 currency code, but received: ${currency}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217,
        });
    }

    return null;
}
