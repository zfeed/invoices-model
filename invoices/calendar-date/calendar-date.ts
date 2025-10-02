import { assertIsISO8601Date } from './asserts/assert-isso8601-date';
import { Result } from '../../building-blocks';

export class CalendarDate {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(date: string) {
        const error = assertIsISO8601Date(date);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new CalendarDate(date));
    }

    public equals(other: CalendarDate): boolean {
        return this.#value === other.#value;
    }
}
