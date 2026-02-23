import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { checkCommentNotBlank } from './checks/check-comment-not-blank';

export class Comment implements Equatable<Comment>, Mappable<string | null> {
    #value: string | null;

    protected constructor(value: string | null) {
        this.#value = value;
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

    static fromPlain(value: string | null) {
        return new Comment(value);
    }

    equals(other: Comment): boolean {
        return this.#value === other.#value;
    }

    toPlain(): string | null {
        return this.#value;
    }

    toString(): string {
        return this.#value ?? '';
    }
}
