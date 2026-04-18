import { Mappable, Result } from '../../../building-blocks/index.ts';
import { Comment } from '../comment/comment.ts';
import { Id } from '../id/id.ts';
import { Timestamp } from '../timestamp/timestamp.ts';

export class Approval implements Mappable<ReturnType<Approval['toPlain']>> {
    protected _approverId: Id;
    protected _createdAt: Timestamp;
    protected _comment: Comment;

    protected constructor(
        approverId: Id,
        createdAt: Timestamp,
        comment: Comment
    ) {
        this._approverId = approverId;
        this._createdAt = createdAt;
        this._comment = comment;
    }

    public get approverId(): Id {
        return this._approverId;
    }

    public get createdAt(): Timestamp {
        return this._createdAt;
    }

    public get comment(): Comment {
        return this._comment;
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

    toPlain() {
        return {
            approverId: this._approverId.toPlain(),
            createdAt: this._createdAt.toPlain(),
            comment: this._comment.toPlain(),
        };
    }
}
