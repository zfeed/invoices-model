import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../building-blocks/index.ts';
import { CalendarDate } from '../../calendar-date/calendar-date.ts'; // Adjust the import path based on where LineItem is defined

export function checkDates({
    issueDate,
    dueDate,
}: {
    issueDate: CalendarDate;
    dueDate: CalendarDate;
}): AppKnownError | null {
    if (dueDate.lessThan(issueDate)) {
        return new AppKnownError({
            message: 'Invoice due date must be after or equal to issue date',
            code: KNOWN_ERROR_CODE.INVOICE_DUE_DATE_ISSUE_DATE_INVALID_RANGE,
        });
    }

    return null;
}
