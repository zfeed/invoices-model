import { Equatable, Mappable, Result } from '../../../../shared/index.ts';
import { checkCommentNotBlank } from './checks/check-comment-not-blank.ts';

export class Comment implements Equatable<Comment>, Mappable<string | null> {
    protected _value: string | null;

    protected constructor(value: string | null) {
        this._value = value;
    }

    static create(value: string | null) {
        if (value === null) {
            return Result.ok(new Comment(value));
        }

        const error = checkCommentNotBlank(value);

        if (error) {
            return Result.error(error);
        }

        return Result.ok(new Comment(value));
    }

    equals(other: Comment): boolean {
        return this._value === other._value;
    }

    toPlain(): string | null {
        return this._value;
    }

    toString(): string {
        return this._value ?? '';
    }
}
