import { randomUUID } from 'crypto';
import { applySpec, isNotEmpty, pipe, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { approvalReferencesExistingApprover } from './checks/check-approver-exists';
import { approversNotEmpty } from './checks/check-approvers-not-empty';
import { noDuplicateApprovals } from './checks/check-no-duplicate-approvals';
import { approversNotDuplicated } from './checks/check-no-duplicate-approvers';
export type Group = {
    id: string;
    isApproved: boolean;
    approvers: Approver[];
    approvals: Approval[];
};

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

const buildGroup = applySpec<Group>({
    id: () => randomUUID(),
    isApproved: pipe(prop('approvals'), isNotEmpty),
    approvers: prop('approvers'),
    approvals: prop('approvals'),
});

export const createGroup = (data: GroupInput): Result<DomainError, Group> =>
    Result.ok<DomainError, GroupInput>(data)
        .flatMap(approversNotEmpty)
        .flatMap(approversNotDuplicated)
        .flatMap(approvalReferencesExistingApprover)
        .flatMap(noDuplicateApprovals)
        .map(buildGroup);
