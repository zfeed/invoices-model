import { Comparable, Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkIsISO8601Date } from './checks/check-iso8601-date';

export class CalendarDate
    implements Equatable<CalendarDate>, Comparable<CalendarDate>, Mappable<string>
{
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static fromPlain(value: string) {
        return new CalendarDate(value);
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
        return this.#value < other.#value;
    }

    public lessThanEqual(other: CalendarDate): boolean {
        return this.#value <= other.#value;
    }

    public greaterThan(other: CalendarDate): boolean {
        return this.#value > other.#value;
    }

    public greaterThanEqual(other: CalendarDate): boolean {
        return this.#value >= other.#value;
    }

    toPlain(): string {
        return this.#value;
    }

    toString(): string {
        return this.#value;
    }
}
