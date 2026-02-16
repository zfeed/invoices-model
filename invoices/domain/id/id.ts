import { randomUUID } from 'crypto';
import { Equatable, Result } from '../../../building-blocks';

export class Id implements Equatable<Id> {
    #value: string;

    protected constructor(value: string) {
        this.#value = value;
    }

    static create() {
        return Result.ok(new Id(randomUUID()));
    }

    static fromString(value: string) {
        return new Id(value);
    }

    equals(other: Id): boolean {
        return this.#value === other.#value;
    }

    toString(): string {
        return this.#value;
    }
}
