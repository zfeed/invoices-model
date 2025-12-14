import { applySpec, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';

export type Approval = {
    approverId: string;
    createdAt: Date;
    comment: string | null;
};

type ApprovalInput = {
    approverId: string;
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
