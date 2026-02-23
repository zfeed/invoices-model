import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkActionNotBlank } from './checks/check-action-not-blank';

export class Action implements Equatable<Action>, Mappable<string> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static create(value: string) {
        const error = checkActionNotBlank(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Action(value));
    }

    static fromPlain(value: string) {
        return new Action(value);
    }

    equals(other: Action): boolean {
        return this.#value === other.#value;
    }

    toPlain(): string {
        return this.#value;
    }

    toString(): string {
        return this.#value;
    }
}
