import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';
import { LineItem } from '../../line-item/line-item.ts'; // Adjust the import path based on where LineItem is defined

export function checkLineItems(lineItems: LineItem[]): AppKnownError | null {
    if (lineItems.length === 0) {
        return new AppKnownError({
            message: 'Invoice must have at least one line item',
            code: KNOWN_ERROR_CODE.LINE_ITEMS_EMPTY,
        });
    }

    if (lineItems.length > 0) {
        const firstCurrency = lineItems[0].price.currency;

        if (
            !lineItems.every((item) =>
                item.price.currency.equals(firstCurrency)
            )
        ) {
            return new AppKnownError({
                message: 'All line items must have the same currency',
                code: KNOWN_ERROR_CODE.LINE_ITEMS_DIFFERENT_CURRENCIES,
            });
        }
    }

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
