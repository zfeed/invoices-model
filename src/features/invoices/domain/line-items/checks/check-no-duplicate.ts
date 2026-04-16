import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared/index.ts';
import { LineItem } from '../../line-item/line-item.ts';

export function checkNoDuplicate(lineItems: LineItem[]): DomainError | null {
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
