import { Result } from '../../building-blocks';
import { assertEmailFormat } from './asserts/assert-email-format';

export class Email {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(value: string) {
        const error = assertEmailFormat(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Email(value));
    }

    equals(other: Email | string): boolean {
        if (typeof other === 'string') {
            return this.#value === other;
        }
        return this.#value === other.#value;
    }
}
