import { LineItem } from '../../line-item/line-item';
import { DomainError, DOMAIN_ERROR_CODE } from '../../../building-blocks';

export function checkNonEmpty(items: LineItem[]): DomainError | null {
    if (items.length === 0) {
        return new DomainError({
            message: 'Cannot create line items with empty array',
            code: DOMAIN_ERROR_CODE.LINE_ITEMS_EMPTY,
        });
    }

    return null;
}
