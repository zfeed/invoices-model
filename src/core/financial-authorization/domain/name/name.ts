import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkNameNotBlank } from './checks/check-name-not-blank';

export class Name implements Equatable<Name>, Mappable<string> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static create(value: string) {
        const error = checkNameNotBlank(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Name(value));
    }

    static fromPlain(value: string) {
        return new Name(value);
    }

    equals(other: Name): boolean {
        return this.#value === other.#value;
    }

    toPlain(): string {
        return this.#value;
    }

    toString(): string {
        return this.#value;
    }
}
