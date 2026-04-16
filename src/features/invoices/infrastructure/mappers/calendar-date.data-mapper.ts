import { CalendarDate } from '../../domain/calendar-date/calendar-date.ts';

export type CalendarDateRecord = {
    value: string;
};

export class CalendarDateDataMapper extends CalendarDate {
    static from(calendarDate: CalendarDate): CalendarDateDataMapper {
        return Object.setPrototypeOf(
            calendarDate,
            CalendarDateDataMapper.prototype
        ) as CalendarDateDataMapper;
    }

    static fromRecord(record: CalendarDateRecord): CalendarDateDataMapper {
        return new CalendarDateDataMapper(record.value);
    }

    toRecord(): CalendarDateRecord {
        return {
            value: this._value,
        };
    }
}
