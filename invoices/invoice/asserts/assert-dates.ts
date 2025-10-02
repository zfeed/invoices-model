import { DOMAIN_ERROR_CODE, DomainError } from '../../../building-blocks';
import { CalendarDate } from '../../calendar-date/calendar-date'; // Adjust the import path based on where LineItem is defined

export function assertDates({
    issueDate,
    dueDate,
}: {
    issueDate: CalendarDate;
    dueDate: CalendarDate;
}): DomainError | null {
    if (dueDate.lessThan(issueDate)) {
        return new DomainError({
            message: 'Invoice due date must be after or equal to issue date',
            code: DOMAIN_ERROR_CODE.INVOICE_DUE_DATE_ISSUE_DATE_INVALID_RANGE,
        });
    }

    return null;
}
