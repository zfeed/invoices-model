import { DOMAIN_ERROR_CODE } from '../../../../../shared/index.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { LineItems } from '../../line-items/line-items.ts';

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
