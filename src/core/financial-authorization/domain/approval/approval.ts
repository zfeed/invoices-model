import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { createComment, Comment } from '../comment/comment';
import { Timestamp, createTimestamp } from '../timestamp/timestamp';
import { fromString, Id } from '../id/id';

export type Approval = {
    approverId: Id;
    createdAt: Timestamp;
    comment: Comment;
};

type ApprovalInput = {
    approverId: string;
    comment: string | null;
};

const buildApproval = applySpec<Approval>({
    approverId: prop('approverId'),
    createdAt: () => createTimestamp(),
    comment: prop('comment'),
});

export const createApproval = (
    data: ApprovalInput
): Result<DomainError, Approval> =>
    fromString(data.approverId).flatMap((approverId) =>
        createComment(data.comment)
            .map((comment) => ({ approverId, comment }))
            .map(buildApproval)
    );
