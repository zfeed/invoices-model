import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Comment } from '../../comment/comment';
import { Id } from '../../id/id';

type ApprovalInput = {
    approverId: Id;
    comment: Comment;
};

const approverIdIsBlank = (data: ApprovalInput) => !data.approverId.trim();
const createApproverIdBlankError = () =>
    Result.error(
        new DomainError({
            message: 'Approver ID cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_ID_BLANK,
        })
    );

export function approverIdIsNotBlank(data: ApprovalInput) {
    return Result.ok<DomainError, ApprovalInput>(data).flatMap(
        ifElse(approverIdIsBlank, createApproverIdBlankError, Result.ok)
    );
}
