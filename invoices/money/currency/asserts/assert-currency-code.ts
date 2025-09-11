import { isISO4217 } from 'validator';
import { DomainError, DOMAIN_ERROR_CODE } from "../../../../building-blocks";

export function assertCurrencyCode(value: string): DomainError | null {
    if (!isISO4217(value)) {
        return new DomainError({
            message: "Expected a valid ISO 4217 currency code, but received: " + value,
            code: DOMAIN_ERROR_CODE.CURRENCY_NOT_ISO_4217,
        });
    }

    return null
}
