import { DomainError, DOMAIN_ERROR_CODE } from '../../../building-blocks';

export function checkIsISO8601Date(value: string): DomainError | null {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!pattern.test(value)) {
        return new DomainError({
            message:
                'Date must be in ISO 8601 format (YYYY-MM-DD), received: ' +
                value,
            code: DOMAIN_ERROR_CODE.CALENDAR_DATE_INVALID_FORMAT,
        });
    }

    return null;
}
