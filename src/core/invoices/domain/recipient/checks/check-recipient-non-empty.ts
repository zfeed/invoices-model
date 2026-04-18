import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';

export function checkRecipientNonEmpty(
    field: string,
    value: string
): AppKnownError | null {
    if (value.trim().length === 0) {
        return new AppKnownError({
            message: `Expected a non-empty value for ${field}, but received an empty string`,
            code: KNOWN_ERROR_CODE.RECIPIENT_EMPTY_FIELD,
        });
    }

    return null;
}
