import { v7 as uuidv7 } from 'uuid';
import { Equatable, Mappable, Result } from '../../../../shared';

export class Id implements Equatable<Id>, Mappable<string> {
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create() {
        return Result.ok(new Id(uuidv7()));
    }

    static fromString(value: string) {
        return new Id(value);
    }

    equals(other: Id): boolean {
        return this._value === other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
