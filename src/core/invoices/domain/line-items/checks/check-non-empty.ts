import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';
import { LineItem } from '../../line-item/line-item.ts';

export function checkNonEmpty(items: LineItem[]): AppKnownError | null {
    if (items.length === 0) {
        return new AppKnownError({
            message: 'Cannot create line items with empty array',
            code: KNOWN_ERROR_CODE.LINE_ITEMS_EMPTY,
        });
    }

    return null;
}
