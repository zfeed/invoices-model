import validator from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';

export function checkCurrencyCode(currency: string): DomainError | null {
    if (!validator.isISO4217(currency)) {
        return new DomainError({
            message: `Expected a valid ISO 4217 currency code, but received: ${currency}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217,
        });
    }

    return null;
}
