import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../shared/index.ts';

export function checkIsISO8601Date(value: string): AppKnownError | null {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!pattern.test(value)) {
        return new AppKnownError({
            message:
                'Date must be in ISO 8601 format (YYYY-MM-DD), received: ' +
                value,
            code: KNOWN_ERROR_CODE.CALENDAR_DATE_INVALID_FORMAT,
        });
    }

    return null;
}
