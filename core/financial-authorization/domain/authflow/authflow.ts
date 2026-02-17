import { randomUUID } from 'crypto';
import { all, applySpec, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Step } from '../step/step';
import { noDuplicateStepOrders } from './checks/check-no-duplicate-step-orders';

export type Authflow = {
    id: string;
    action: string;
    isApproved: boolean;
    steps: Step[];
};

export type AuthflowInput = {
    action: string;
    steps: Step[];
};

const allStepsApproved = (data: AuthflowInput): boolean =>
    all(prop('isApproved'), data.steps);

const buildAuthflow = applySpec<Authflow>({
    id: () => randomUUID(),
    action: prop('action'),
    isApproved: allStepsApproved,
    steps: prop('steps'),
});

export const createAuthflow = (
    data: AuthflowInput
): Result<DomainError, Authflow> =>
    Result.ok<DomainError, AuthflowInput>(data)
        .flatMap(noDuplicateStepOrders)
        .map(buildAuthflow);

export const findAuthflowByAction = (
    authflows: Authflow[],
    action: string
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
