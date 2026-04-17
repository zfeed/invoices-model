import { KNOWN_ERROR_CODE } from '../../../../../shared/index.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';
import { LineItems } from '../../line-items/line-items.ts';

export function checkLineItemsNotEmpty(
    lineItems: LineItems | null
): AppKnownError | null {
    if (lineItems === null) {
        return new AppKnownError({
            code: KNOWN_ERROR_CODE.DRAFT_INVOICE_LINE_ITEMS_EMPTY,
            message: 'Draft invoice line items cannot be empty',
        });
    }
    return null;
}
