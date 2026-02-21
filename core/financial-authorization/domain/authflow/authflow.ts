import { all, applySpec, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import { Action } from '../action/action';
import { createId, Id } from '../id/id';
import { Range } from '../range/range';
import { approveStep, hasEligibleApprover, Step } from '../step/step';
import { noDuplicateStepOrders } from './checks/check-no-duplicate-step-orders';

export type Authflow = {
    id: Id;
    action: Action;
    range: Range;
    isApproved: boolean;
    steps: Step[];
};

export type AuthflowInput = {
    action: Action;
    range: Range;
    steps: Step[];
};

type RebuildAuthflowInput = AuthflowInput & { id: Id };

const allStepsApproved = (data: AuthflowInput): boolean =>
    all(prop('isApproved'), data.steps);

const buildAuthflow = applySpec<Authflow>({
    id: () => createId(),
    action: prop('action'),
    range: prop('range'),
    isApproved: allStepsApproved,
    steps: prop('steps'),
});

const rebuildAuthflow = applySpec<Authflow>({
    id: prop('id'),
    action: prop('action'),
    range: prop('range'),
    isApproved: allStepsApproved,
    steps: prop('steps'),
});

export const createAuthflow = (
    data: AuthflowInput
): Result<DomainError, Authflow> =>
    Result.ok<DomainError, AuthflowInput>(data)
        .flatMap(noDuplicateStepOrders)
        .map(buildAuthflow);

const recreateAuthflow = (
    data: RebuildAuthflowInput
): Result<DomainError, Authflow> =>
    Result.ok<DomainError, RebuildAuthflowInput>(data)
        .flatMap(noDuplicateStepOrders)
        .map(rebuildAuthflow);

export const findAuthflowByAction = (
    authflows: Authflow[],
    action: Action
): Result<DomainError, Authflow> => {
    const authflow = authflows.find((a) => a.action === action);
    return authflow
        ? Result.ok(authflow)
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
                  message: `Authflow with action ${action} not found`,
              })
          );
};

type CanApproverApproveInput = {
    authflows: Authflow[];
    action: Action;
    approverId: Id;
};

export const canApproverApprove = (
    data: CanApproverApproveInput
): boolean => {
    const result = findAuthflowByAction(data.authflows, data.action);

    if (result.isError()) {
        return false;
    }

    const authflow = result.unwrap();

    if (authflow.isApproved) {
        return false;
    }

    return hasEligibleApprover(authflow.steps, data.approverId);
};

type ApproveAuthflowInput = {
    authflows: Authflow[];
    action: Action;
    approver: Approver;
};

type ApproveWithAuthflow = ApproveAuthflowInput & { authflow: Authflow };

type ApproveWithStep = ApproveWithAuthflow & { updatedStep: Step };

const findAuthflow = (
    data: ApproveAuthflowInput
): Result<DomainError, ApproveWithAuthflow> =>
    findAuthflowByAction(data.authflows, data.action).map((authflow) => ({
        ...data,
        authflow,
    }));

const applyApproval = (
    data: ApproveWithAuthflow
): Result<DomainError, ApproveWithStep> =>
    approveStep({
        steps: data.authflow.steps,
        approver: data.approver,
    }).map((updatedStep) => ({ ...data, updatedStep }));

const buildApprovedAuthflow = (
    data: ApproveWithStep
): Result<DomainError, Authflow> =>
    recreateAuthflow({
        id: data.authflow.id,
        action: data.authflow.action,
        range: data.authflow.range,
        steps: data.authflow.steps.map((s) =>
            s.order === data.updatedStep.order ? data.updatedStep : s
        ),
    });

export const approveAuthflow = (
    data: ApproveAuthflowInput
): Result<DomainError, Authflow> =>
    Result.ok<DomainError, ApproveAuthflowInput>(data)
        .flatMap(findAuthflow)
        .flatMap(applyApproval)
        .flatMap(buildApprovedAuthflow);
