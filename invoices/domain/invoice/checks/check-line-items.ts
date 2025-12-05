import { DOMAIN_ERROR_CODE, DomainError } from '../../../../building-blocks';
import { LineItem } from '../../line-item/line-item'; // Adjust the import path based on where LineItem is defined

export function checkLineItems(lineItems: LineItem[]): DomainError | null {
    if (lineItems.length === 0) {
        return new DomainError({
            message: 'Invoice must have at least one line item',
            code: DOMAIN_ERROR_CODE.LINE_ITEMS_EMPTY,
        });
    }

    if (lineItems.length > 0) {
        const firstCurrency = lineItems[0].price.currency;

        if (
            !lineItems.every((item) =>
                item.price.currency.equals(firstCurrency)
            )
        ) {
            return new DomainError({
                message: 'All line items must have the same currency',
                code: DOMAIN_ERROR_CODE.LINE_ITEMS_DIFFERENT_CURRENCIES,
            });
        }
    }

    for (let i = 0; i < lineItems.length; i++) {
        for (let j = i + 1; j < lineItems.length; j++) {
            if (lineItems[i].equals(lineItems[j])) {
                return new DomainError({
                    message: 'Duplicate line item',
                    code: DOMAIN_ERROR_CODE.LINE_ITEMS_DUPLICATE,
                });
            }
        }
    }

    return null;
}
