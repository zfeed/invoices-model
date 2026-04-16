import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared/index.ts';
import { LineItem } from '../../line-item/line-item.ts';

export function checkNonEmpty(items: LineItem[]): DomainError | null {
    if (items.length === 0) {
        return new DomainError({
            message: 'Cannot create line items with empty array',
            code: DOMAIN_ERROR_CODE.LINE_ITEMS_EMPTY,
        });
    }

    return null;
}
