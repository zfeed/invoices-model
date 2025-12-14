import { ifElse, length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Approval } from '../../approval/approval';
import { Approver } from '../../approver/approver';

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

const hasDuplicateApprovals = (data: GroupInput) => {
    const approverIds = map(prop('approverId'), data.approvals);
    const uniqueIds = uniq(approverIds);
    return length(approverIds) !== length(uniqueIds);
};
const createDuplicateApprovalsError = () =>
    Result.error(
        new DomainError({
            message: 'Duplicate approver IDs found in approvals',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE,
        })
    );

export function noDuplicateApprovals(data: GroupInput) {
    return Result.ok<DomainError, GroupInput>(data).flatMap(
        ifElse(hasDuplicateApprovals, createDuplicateApprovalsError, Result.ok)
    );
}
