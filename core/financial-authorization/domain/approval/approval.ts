import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Id } from '../id/id';

export type Approval = {
    approverId: Id;
    createdAt: Date;
    comment: string | null;
};

type ApprovalInput = {
    approverId: Id;
    comment: string | null;
};

const buildApproval = applySpec<Approval>({
    approverId: prop('approverId'),
    createdAt: () => new Date(),
    comment: prop('comment'),
});

export const createApproval = (
    data: ApprovalInput
): Result<DomainError, Approval> =>
    Result.ok<DomainError, ApprovalInput>(data).map(buildApproval);
