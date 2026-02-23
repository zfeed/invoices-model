import { applySpec, isNotEmpty, map, pipe, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approval, PlainApproval, approvalToPlain, createApproval } from '../approval/approval';
import { Approver, PlainApprover, approverToPlain } from '../approver/approver';
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

export type PlainGroup = {
    id: string;
    isApproved: boolean;
    approvers: PlainApprover[];
    approvals: PlainApproval[];
};

export const groupToPlain = (group: Group): PlainGroup => ({
    id: group.id,
    isApproved: group.isApproved,
    approvers: map(approverToPlain, group.approvers),
    approvals: map(approvalToPlain, group.approvals),
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

const findGroup = (
    groups: Group[],
    approver: Approver
): Result<DomainError, Group> => {
    const group = groups.find(
        (g) =>
            !g.isApproved && g.approvers.some((a) => a.id === approver.id)
    );
    return group
        ? Result.ok(group)
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                  message: `No eligible group found for approver ${approver.id}`,
              })
          );
};

export const hasEligibleApprover = (groups: Group[], approverId: Id): boolean =>
    groups.some(
        (g) => !g.isApproved && g.approvers.some((a) => a.id === approverId)
    );

export const approveGroup = (
    groups: Group[],
    approver: Approver
): Result<DomainError, Group[]> =>
    findGroup(groups, approver).flatMap((group) =>
        createApproval({ approverId: approver.id, comment: null }).flatMap(
            (approval) =>
                recreateGroup({
                    id: group.id,
                    approvers: group.approvers,
                    approvals: [...group.approvals, approval],
                }).map((updatedGroup) =>
                    groups.map((g) =>
                        g.id === group.id ? updatedGroup : g
                    )
                )
        )
    );
