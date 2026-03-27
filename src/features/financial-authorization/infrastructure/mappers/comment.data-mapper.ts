import { Comment } from '../../domain/comment/comment';

export type CommentRecord = {
    value: string | null;
};

export class CommentDataMapper extends Comment {
    static from(comment: Comment): CommentDataMapper {
        return Object.setPrototypeOf(
            comment,
            CommentDataMapper.prototype
        ) as CommentDataMapper;
    }

    static fromRecord(record: CommentRecord): CommentDataMapper {
        return new CommentDataMapper(record.value);
    }

    toRecord(): CommentRecord {
        return {
            value: this._value,
        };
    }
}
