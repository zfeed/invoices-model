import { Approval } from '../../domain/approval/approval.ts';
import { CommentDataMapper, CommentRecord } from './comment.data-mapper.ts';
import { IdDataMapper, IdRecord } from './id.data-mapper.ts';
import { TimestampDataMapper, TimestampRecord } from './timestamp.data-mapper.ts';

export type ApprovalRecord = {
    approverId: IdRecord;
    createdAt: TimestampRecord;
    comment: CommentRecord;
};

export class ApprovalDataMapper extends Approval {
    static from(approval: Approval): ApprovalDataMapper {
        return Object.setPrototypeOf(
            approval,
            ApprovalDataMapper.prototype
        ) as ApprovalDataMapper;
    }

    static fromRecord(record: ApprovalRecord): ApprovalDataMapper {
        return new ApprovalDataMapper(
            IdDataMapper.fromRecord(record.approverId),
            TimestampDataMapper.fromRecord(record.createdAt),
            CommentDataMapper.fromRecord(record.comment)
        );
    }

    toRecord(): ApprovalRecord {
        return {
            approverId: IdDataMapper.from(this._approverId).toRecord(),
            createdAt: TimestampDataMapper.from(this._createdAt).toRecord(),
            comment: CommentDataMapper.from(this._comment).toRecord(),
        };
    }
}
