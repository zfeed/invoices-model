import { applySpec, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import { approveGroup, Group } from '../groups/group';
import { createId, Id } from '../id/id';
import { orderNonNegative } from './checks/check-order-non-negative';

export type Step = {
    id: Id;
    order: number;
    isApproved: boolean;
    groups: Group[];
};

type StepInput = {
    order: number;
    groups: Group[];
};

type RebuildStepInput = StepInput & { id: Id };

const allGroupsApproved = (data: StepInput) =>
    data.groups.every((group) => group.isApproved);

const buildStep = applySpec<Step>({
    id: () => createId(),
    order: prop('order'),
    isApproved: allGroupsApproved,
    groups: prop('groups'),
});

const rebuildStep = applySpec<Step>({
    id: prop('id'),
    order: prop('order'),
    isApproved: allGroupsApproved,
    groups: prop('groups'),
});

const findCurrentStep = (steps: Step[]): Result<DomainError, Step> => {
    const step = steps
        .filter((s) => !s.isApproved)
        .sort((a, b) => a.order - b.order)[0];
    return step
        ? Result.ok(step)
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                  message: 'No pending steps found',
              })
          );
};

type ApproveStepInput = {
    steps: Step[];
    approver: Approver;
};

type ApproveStepWithStep = ApproveStepInput & { step: Step };

type ApproveStepWithGroups = ApproveStepWithStep & { updatedGroups: Group[] };

const findStep = (
    data: ApproveStepInput
): Result<DomainError, ApproveStepWithStep> =>
    findCurrentStep(data.steps).map((step) => ({ ...data, step }));

const applyAproval = (
    data: ApproveStepWithStep
): Result<DomainError, ApproveStepWithGroups> =>
    approveGroup(data.step.groups, data.approver).map((updatedGroups) => ({
        ...data,
        updatedGroups,
    }));

const buildApprovedStep = (
    data: ApproveStepWithGroups
): Result<DomainError, Step> =>
    recreateStep({
        id: data.step.id,
        order: data.step.order,
        groups: data.updatedGroups,
    });

export const createStep = (data: StepInput): Result<DomainError, Step> =>
    Result.ok<DomainError, StepInput>(data)
        .flatMap(orderNonNegative)
        .map(buildStep);

const recreateStep = (data: RebuildStepInput): Result<DomainError, Step> =>
    Result.ok<DomainError, RebuildStepInput>(data)
        .flatMap(orderNonNegative)
        .map(rebuildStep);

export const approveStep = (
    data: ApproveStepInput
): Result<DomainError, Step> =>
    Result.ok<DomainError, ApproveStepInput>(data)
        .flatMap(findStep)
        .flatMap(applyAproval)
        .flatMap(buildApprovedStep);
