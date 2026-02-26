import { Mappable, Result } from '../../../../building-blocks';
import { Comment } from '../comment/comment';
import { Id } from '../id/id';
import { Timestamp } from '../timestamp/timestamp';

export class Approval implements Mappable<ReturnType<Approval['toPlain']>> {
    #approverId: Id;
    #createdAt: Timestamp;
    #comment: Comment;

    protected constructor(
        approverId: Id,
        createdAt: Timestamp,
        comment: Comment
    ) {
        this.#approverId = approverId;
        this.#createdAt = createdAt;
        this.#comment = comment;
    }

    public get approverId(): Id {
        return this.#approverId;
    }

    public get createdAt(): Timestamp {
        return this.#createdAt;
    }

    public get comment(): Comment {
        return this.#comment;
    }

    static create(data: { approverId: Id; comment: string | null }) {
        const commentResult = Comment.create(data.comment);

        if (commentResult.isError()) {
            return commentResult.error();
        }

        return Result.ok(
            new Approval(
                data.approverId,
                Timestamp.create(),
                commentResult.unwrap()
            )
        );
    }

    static fromPlain(plain: {
        approverId: string;
        createdAt: string;
        comment: string | null;
    }) {
        return new Approval(
            Id.fromPlain(plain.approverId),
            Timestamp.fromPlain(plain.createdAt),
            Comment.fromPlain(plain.comment)
        );
    }

    toPlain() {
        return {
            approverId: this.#approverId.toPlain(),
            createdAt: this.#createdAt.toPlain(),
            comment: this.#comment.toPlain(),
        };
    }
}
