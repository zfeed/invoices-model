import { Equatable, Mappable, Result } from '../../../building-blocks/index.ts';
import { checkReferenceIdNotBlank } from './checks/check-reference-id-not-blank.ts';

export class ReferenceId implements Equatable<ReferenceId>, Mappable<string> {
    protected _value: string;

    protected constructor(value: string) {
        this._value = value;
    }

    static create(value: string) {
        const error = checkReferenceIdNotBlank(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new ReferenceId(value));
    }

    equals(other: ReferenceId): boolean {
        return this._value === other._value;
    }

    toPlain(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }
}
