import { DOMAIN_ERROR_CODE } from '../../../building-blocks';
import { DomainError } from '../../../building-blocks/domain-error';
import { LineItems } from '../../line-items/line-items';

export function checkLineItemsNotEmpty(
    lineItems: LineItems | null
): DomainError | null {
    if (lineItems === null) {
        return new DomainError({
            code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_LINE_ITEMS_EMPTY,
            message: 'Draft invoice line items cannot be empty',
        });
    }
    return null;
}
