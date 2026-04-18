import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../building-blocks/index.ts';

export function checkDescriptionNonEmpty(value: string): AppKnownError | null {
    if (value.trim().length === 0) {
        return new AppKnownError({
            message: 'Description must not be empty',
            code: KNOWN_ERROR_CODE.LINE_ITEM_EMPTY_DESCRIPTION,
        });
    }

    return null;
}
