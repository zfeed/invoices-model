import { Equatable, Mappable } from '../../../building-blocks/index.ts';

export class Timestamp implements Equatable<Timestamp>, Mappable<string> {
    protected _value: Date;

    protected constructor(value: Date) {
        this._value = value;
    }

    static create() {
        return new Timestamp(new Date());
    }

    equals(other: Timestamp): boolean {
        return this._value.getTime() === other._value.getTime();
    }

    toPlain(): string {
        return this._value.toISOString();
    }

    toString(): string {
        return this._value.toISOString();
    }
}
