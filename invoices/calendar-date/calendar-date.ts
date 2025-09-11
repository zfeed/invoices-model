import { assertIsISO8601Date } from "./asserts/assert-isso8601-date";
import { left, right } from "@sweet-monads/either";

export class IssueDate {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(input: string) {
        const error = assertIsISO8601Date(input);

        if (error) {
            return left(error);
        }

        return right(new IssueDate(input));
    }

    public equals(other: IssueDate): boolean {
        return this.#value === other.#value;
    }
}
