import { randomUUID } from 'crypto';
import { applySpec, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import { approveGroup, Group } from '../groups/group';
import { orderNonNegative } from './checks/check-order-non-negative';

export type Step = {
    id: string;
    order: number;
    isApproved: boolean;
    groups: Group[];
};

type StepInput = {
    order: number;
    groups: Group[];
};

const allGroupsApproved = (data: StepInput) =>
    data.groups.every((group) => group.isApproved);

const buildStep = applySpec<Step>({
    id: () => randomUUID(),
    order: prop('order'),
    isApproved: allGroupsApproved,
    groups: prop('groups'),
});

type ApproveInput = {
    step: Step;
    groupId: string;
    approver: Approver;
};

type ApproveWithGroup = ApproveInput & { group: Group };

const findGroup = (
    data: ApproveInput
): Result<DomainError, ApproveWithGroup> => {
    const group = data.step.groups.find((g) => g.id === data.groupId);
    return group
        ? Result.ok({ ...data, group })
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                  message: `Group with id ${data.groupId} not found`,
              })
          );
};

const applyApproval = (
    data: ApproveWithGroup
): Result<DomainError, StepInput> =>
    approveGroup(data.group, data.approver).map((updatedGroup) => ({
        order: data.step.order,
        groups: data.step.groups.map((g) =>
            g.id === data.groupId ? updatedGroup : g
        ),
    }));

export const createStep = (data: StepInput): Result<DomainError, Step> =>
    Result.ok<DomainError, StepInput>(data)
        .flatMap(orderNonNegative)
        .map(buildStep);

export const approveStep = (data: ApproveInput): Result<DomainError, Step> =>
    Result.ok<DomainError, ApproveInput>(data)
        .flatMap(findGroup)
        .flatMap(applyApproval)
        .flatMap(createStep);
