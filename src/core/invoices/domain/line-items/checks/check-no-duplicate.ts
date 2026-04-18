import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';
import { LineItem } from '../../line-item/line-item.ts';

export function checkNoDuplicate(lineItems: LineItem[]): AppKnownError | null {
    for (let i = 0; i < lineItems.length; i++) {
        for (let j = i + 1; j < lineItems.length; j++) {
            if (lineItems[i].equals(lineItems[j])) {
                return new AppKnownError({
                    message: 'Duplicate line item',
                    code: KNOWN_ERROR_CODE.LINE_ITEMS_DUPLICATE,
                });
            }
        }
    }

    return null;
}
