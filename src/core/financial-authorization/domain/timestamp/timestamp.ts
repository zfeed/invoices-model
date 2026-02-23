import { Equatable, Mappable } from '../../../../building-blocks';

export class Timestamp implements Equatable<Timestamp>, Mappable<string> {
    #value: Date;

    protected constructor(value: Date) {
        this.#value = value;
    }

    static create() {
        return new Timestamp(new Date());
    }

    static fromPlain(value: string) {
        return new Timestamp(new Date(value));
    }

    equals(other: Timestamp): boolean {
        return this.#value.getTime() === other.#value.getTime();
    }

    toPlain(): string {
        return this.#value.toISOString();
    }

    toString(): string {
        return this.#value.toISOString();
    }
}
