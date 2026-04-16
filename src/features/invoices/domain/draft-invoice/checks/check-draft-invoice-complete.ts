import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../shared/index.ts';
import { CalendarDate } from '../../calendar-date/calendar-date.ts';
import { Issuer } from '../../issuer/issuer.ts';
import { LineItems } from '../../line-items/line-items.ts';
import { Money } from '../../money/money/money.ts';
import { Recipient } from '../../recipient/recipient.ts';
import { VatRate } from '../../vat-rate/vat-rate.ts';

export function checkDraftInvoiceComplete({
    total,
    vatRate,
    vatAmount,
    lineItems,
    issueDate,
    dueDate,
    issuer,
    recipient,
}: {
    total: Money | null;
    vatRate: VatRate | null;
    vatAmount: Money | null;
    lineItems: LineItems | null;
    issueDate: CalendarDate | null;
    dueDate: CalendarDate | null;
    issuer: Issuer | null;
    recipient: Recipient | null;
}): DomainError | null {
    const invoiceIncompleteError = new DomainError({
        message: 'Draft invoice is not fully complete',
        code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_NOT_FULLY_COMPLETE,
    });

    if (
        total === null ||
        lineItems === null ||
        issueDate === null ||
        dueDate === null ||
        issuer === null ||
        recipient === null
    ) {
        return invoiceIncompleteError;
    }

    if (
        (vatRate === null && vatAmount !== null) ||
        (vatRate !== null && vatAmount === null)
    ) {
        return invoiceIncompleteError;
    }

    return null;
}
