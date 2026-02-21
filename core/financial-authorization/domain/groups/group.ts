import { applySpec, isNotEmpty, pipe, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approval, createApproval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { createId, Id } from '../id/id';
import { approvalReferencesExistingApprover } from './checks/check-approver-exists';
import { approversNotEmpty } from './checks/check-approvers-not-empty';
import { approvalsNotDuplicated } from './checks/check-no-duplicate-approvals';
import { approversNotDuplicated } from './checks/check-no-duplicate-approvers';
export type Group = {
    id: Id;
    isApproved: boolean;
    approvers: Approver[];
    approvals: Approval[];
};

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

type RebuildGroupInput = GroupInput & { id: Id };

const buildGroup = applySpec<Group>({
    id: () => createId(),
    isApproved: pipe(prop('approvals'), isNotEmpty),
    approvers: prop('approvers'),
    approvals: prop('approvals'),
});

const rebuildGroup = applySpec<Group>({
    id: prop('id'),
    isApproved: pipe(prop('approvals'), isNotEmpty),
    approvers: prop('approvers'),
    approvals: prop('approvals'),
});

export const createGroup = (data: GroupInput): Result<DomainError, Group> =>
    Result.ok<DomainError, GroupInput>(data)
        .flatMap(approversNotEmpty)
        .flatMap(approversNotDuplicated)
        .flatMap(approvalReferencesExistingApprover)
        .flatMap(approvalsNotDuplicated)
        .map(buildGroup);

const recreateGroup = (data: RebuildGroupInput): Result<DomainError, Group> =>
    Result.ok<DomainError, RebuildGroupInput>(data)
        .flatMap(approversNotEmpty)
        .flatMap(approversNotDuplicated)
        .flatMap(approvalReferencesExistingApprover)
        .flatMap(approvalsNotDuplicated)
        .map(rebuildGroup);

type ApproveGroupInput = {
    groups: Group[];
    approver: Approver;
};

type ApproveGroupWithGroup = ApproveGroupInput & { group: Group };

type ApproveGroupWithApproval = ApproveGroupWithGroup & {
    approval: Approval;
};

const findGroup = (
    data: ApproveGroupInput
): Result<DomainError, ApproveGroupWithGroup> => {
    const group = data.groups.find(
        (g) =>
            !g.isApproved && g.approvers.some((a) => a.id === data.approver.id)
    );
    return group
        ? Result.ok({ ...data, group })
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                  message: `No eligible group found for approver ${data.approver.id}`,
              })
          );
};

const addApproval = (
    data: ApproveGroupWithGroup
): Result<DomainError, ApproveGroupWithApproval> =>
    createApproval({ approverId: data.approver.id, comment: null }).map(
        (approval) => ({ ...data, approval })
    );

const buildUpdatedGroups = (
    data: ApproveGroupWithApproval
): Result<DomainError, Group[]> =>
    recreateGroup({
        id: data.group.id,
        approvers: data.group.approvers,
        approvals: [...data.group.approvals, data.approval],
    }).map((updatedGroup) =>
        data.groups.map((g) => (g.id === data.group.id ? updatedGroup : g))
    );

export const hasEligibleApprover = (groups: Group[], approverId: Id): boolean =>
    groups.some(
        (g) => !g.isApproved && g.approvers.some((a) => a.id === approverId)
    );

export const approveGroup = (
    groups: Group[],
    approver: Approver
): Result<DomainError, Group[]> =>
    Result.ok<DomainError, ApproveGroupInput>({ groups, approver })
        .flatMap(findGroup)
        .flatMap(addApproval)
        .flatMap(buildUpdatedGroups);
