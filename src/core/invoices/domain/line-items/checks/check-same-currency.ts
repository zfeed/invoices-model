import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';
import { LineItem } from '../../line-item/line-item.ts';

export function checkSameCurrency(items: LineItem[]): AppKnownError | null {
    const firstCurrency = items[0].total.currency;

    for (let i = 1; i < items.length; i++) {
        if (!items[i].total.currency.equals(firstCurrency)) {
            return new AppKnownError({
                message: 'All line items must have the same currency',
                code: KNOWN_ERROR_CODE.LINE_ITEMS_DIFFERENT_CURRENCIES,
            });
        }
    }

    return null;
}
