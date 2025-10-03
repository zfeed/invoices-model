import { Money } from '../../money/money/money';
import { Vat } from '../../vat/vat';
import { LineItems } from '../../line-items/line-items';
import { Issuer } from '../../issuer/issuer';
import { Recipient } from '../../recipient/recipient';
import { CalendarDate } from '../../calendar-date/calendar-date';
import { IBilling } from '../../recipient/billing/billing.interface';
import { DomainError, DOMAIN_ERROR_CODE } from '../../../building-blocks';

export function checkDraftInvoiceComplete<T, D, B extends IBilling<T, D>>(
    total: Money | null,
    vat: Vat | null,
    lineItems: LineItems | null,
    issueDate: CalendarDate | null,
    dueDate: CalendarDate | null,
    issuer: Issuer | null,
    recipient: Recipient<T, D, B> | null
): DomainError | null {
    if (
        total === null ||
        vat === null ||
        lineItems === null ||
        issueDate === null ||
        dueDate === null ||
        issuer === null ||
        recipient === null
    ) {
        return new DomainError({
            message: 'Draft invoice is not fully complete',
            code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_NOT_FULLY_COMPLETE,
        });
    }

    return null;
}
