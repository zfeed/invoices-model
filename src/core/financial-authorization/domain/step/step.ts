import { applySpec, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import {
    approveGroup,
    hasEligibleApprover as hasEligibleApproverInGroups,
    Group,
} from '../groups/group';
import { createId, Id } from '../id/id';
import { Order } from '../order/order';

export type Step = {
    id: Id;
    order: Order;
    isApproved: boolean;
    groups: Group[];
};

type StepInput = {
    order: Order;
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

export const hasEligibleApprover = (steps: Step[], approverId: Id): boolean => {
    const result = findCurrentStep(steps);

    if (
        result.isError() &&
        result.unwrapError().code ===
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
    ) {
        return false;
    }

    return hasEligibleApproverInGroups(result.unwrap().groups, approverId);
};

export const createStep = (data: StepInput): Result<DomainError, Step> =>
    Result.ok<DomainError, StepInput>(data).map(buildStep);

const recreateStep = (
    data: RebuildStepInput
): Result<DomainError, Step> =>
    Result.ok<DomainError, RebuildStepInput>(data).map(rebuildStep);

export const approveStep = (
    steps: Step[],
    approver: Approver
): Result<DomainError, Step> =>
    findCurrentStep(steps).flatMap((step) =>
        approveGroup(step.groups, approver).flatMap((updatedGroups) =>
            recreateStep({
                id: step.id,
                order: step.order,
                groups: updatedGroups,
            })
        )
    );
