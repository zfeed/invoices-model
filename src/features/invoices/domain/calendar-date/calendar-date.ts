import { Comparable, Equatable, Mappable, Result } from '../../../../shared/index.ts';
import { checkIsISO8601Date } from './checks/check-iso8601-date.ts';

export class CalendarDate
    implements
        Equatable<CalendarDate>,
        Comparable<CalendarDate>,
        Mappable<string>
{
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create(date: string) {
        const error = checkIsISO8601Date(date);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new CalendarDate(date));
    }

    equals(other: CalendarDate): boolean {
        return this._value === other._value;
    }

    lessThan(other: CalendarDate): boolean {
        return this._value < other._value;
    }

    lessThanEqual(other: CalendarDate): boolean {
        return this._value <= other._value;
    }

    greaterThan(other: CalendarDate): boolean {
        return this._value > other._value;
    }

    greaterThanEqual(other: CalendarDate): boolean {
        return this._value >= other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
