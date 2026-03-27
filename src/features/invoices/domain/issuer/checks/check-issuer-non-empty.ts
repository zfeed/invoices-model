import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared';

export function checkIssuerNonEmpty(
    field: string,
    value: string
): DomainError | null {
    if (value.trim().length === 0) {
        return new DomainError({
            message: `Expected a non-empty value for ${field}, but received an empty string`,
            code: DOMAIN_ERROR_CODE.ISSUER_EMPTY_FIELD,
        });
    }

    return null;
}
