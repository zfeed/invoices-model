import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Action } from '../action/action';
import { createId, Id } from '../id/id';
import { AuthflowTemplate } from './authflow-template';
import { noOverlappingRanges } from './checks/check-no-overlapping-ranges';

export type AuthflowPolicy = {
    id: Id;
    action: Action;
    templates: AuthflowTemplate[];
};

export type AuthflowPolicyInput = {
    action: Action;
    templates: AuthflowTemplate[];
};

type RebuildAuthflowPolicyInput = AuthflowPolicyInput & { id: Id };

const buildAuthflowPolicy = applySpec<AuthflowPolicy>({
    id: () => createId(),
    action: prop('action'),
    templates: prop('templates'),
});

const rebuildAuthflowPolicy = applySpec<AuthflowPolicy>({
    id: prop('id'),
    action: prop('action'),
    templates: prop('templates'),
});

export const createAuthflowPolicy = (
    data: AuthflowPolicyInput
): Result<DomainError, AuthflowPolicy> =>
    Result.ok<DomainError, AuthflowPolicyInput>(data)
        .flatMap(noOverlappingRanges)
        .map(buildAuthflowPolicy);

export const recreateAuthflowPolicy = (
    data: RebuildAuthflowPolicyInput
): Result<DomainError, AuthflowPolicy> =>
    Result.ok<DomainError, RebuildAuthflowPolicyInput>(data)
        .flatMap(noOverlappingRanges)
        .map(rebuildAuthflowPolicy);
