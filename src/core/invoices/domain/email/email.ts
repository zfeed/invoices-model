import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkEmailFormat } from './checks/check-email-format';

export class Email implements Equatable<Email | string>, Mappable<string> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static fromPlain(value: string) {
        return new Email(value);
    }

    static create(value: string) {
        const error = checkEmailFormat(value);

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

    toPlain(): string {
        return this.#value;
    }

    toString(): string {
        return this.#value;
    }
}
