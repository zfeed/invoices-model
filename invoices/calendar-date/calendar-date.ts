import { Comparable, Equatable, Result } from '../../building-blocks';
import { checkIsISO8601Date } from './checks/check-iso8601-date';

export class CalendarDate
    implements Equatable<CalendarDate>, Comparable<CalendarDate>
{
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(date: string) {
        const error = checkIsISO8601Date(date);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new CalendarDate(date));
    }

    public equals(other: CalendarDate): boolean {
        return this.#value === other.#value;
    }

    public lessThan(other: CalendarDate): boolean {
        return (
            new Date(this.#value).getTime() < new Date(other.#value).getTime()
        );
    }

    toString(): string {
        return this.#value;
    }
}
