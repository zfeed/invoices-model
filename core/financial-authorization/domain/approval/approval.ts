import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Comment } from '../comment/comment';
import { Timestamp, createTimestamp } from '../timestamp/timestamp';
import { Id } from '../id/id';

export type Approval = {
    approverId: Id;
    createdAt: Timestamp;
    comment: Comment;
};

type ApprovalInput = {
    approverId: Id;
    comment: Comment;
};

const buildApproval = applySpec<Approval>({
    approverId: prop('approverId'),
    createdAt: () => createTimestamp(),
    comment: prop('comment'),
});

export const createApproval = (
    data: ApprovalInput
): Result<DomainError, Approval> =>
    Result.ok<DomainError, ApprovalInput>(data).map(buildApproval);
