import { randomUUID } from 'crypto';
import { isNotEmpty } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { checkApproverExists } from './checks/check-approver-exists';
import { checkApproversNotEmpty } from './checks/check-approvers-not-empty';
import { checkNoDuplicateApprovals } from './checks/check-no-duplicate-approvals';
import { checkNoDuplicateApprovers } from './checks/check-no-duplicate-approvers';
``;

export type Group = {
    id: string;
    isApproved: boolean;
    approvers: Approver[];
    approvals: Approval[];
};

export function createGroup(data: {
    approvers: Approver[];
    approvals: Approval[];
}): Result<DomainError, Group> {
    const approversNotEmptyError = checkApproversNotEmpty(data.approvers);

    if (approversNotEmptyError) {
        return Result.error(approversNotEmptyError);
    }

    const duplicateApproversError = checkNoDuplicateApprovers(data.approvers);

    if (duplicateApproversError) {
        return Result.error(duplicateApproversError);
    }

    const duplicateApprovalsError = checkNoDuplicateApprovals(data.approvals);

    if (duplicateApprovalsError) {
        return Result.error(duplicateApprovalsError);
    }

    const approverExistsError = checkApproverExists(
        data.approvers,
        data.approvals
    );

    if (approverExistsError) {
        return Result.error(approverExistsError);
    }

    const isApproved = isNotEmpty(data.approvals);

    return Result.ok({
        id: randomUUID(),
        isApproved,
        approvers: data.approvers,
        approvals: data.approvals,
    });
}
