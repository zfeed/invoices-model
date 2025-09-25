import { LineItem } from '../../line-item/line-item';
import { DomainError, DOMAIN_ERROR_CODE } from '../../../building-blocks';

export function assertSameCurrency(items: LineItem[]): DomainError | null {
    const firstCurrency = items[0].total.currency;

    for (let i = 1; i < items.length; i++) {
        if (!items[i].total.currency.equals(firstCurrency)) {
            return new DomainError({
                message: 'All line items must have the same currency',
                code: DOMAIN_ERROR_CODE.LINE_ITEMS_DIFFERENT_CURRENCIES,
            });
        }
    }

    return null;
}
