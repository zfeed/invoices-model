import { assertIsISO8601Date } from './asserts/assert-isso8601-date';
import { Result } from '../../building-blocks';

export class IssueDate {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(date: string) {
        const error = assertIsISO8601Date(date);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new IssueDate(date));
    }

    public equals(other: IssueDate): boolean {
        return this.#value === other.#value;
    }
}
