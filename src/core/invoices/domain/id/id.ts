import { randomUUID } from 'crypto';
import { Equatable, Mappable, Result } from '../../../../building-blocks';

export class Id implements Equatable<Id>, Mappable<string> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static create() {
        return Result.ok(new Id(randomUUID()));
    }

    static fromPlain(value: string) {
        return new Id(value);
    }

    static fromString(value: string) {
        return Id.fromPlain(value);
    }

    equals(other: Id): boolean {
        return this.#value === other.#value;
    }

    toPlain(): string {
        return this.#value;
    }

    toString(): string {
        return this.#value;
    }
}
