import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Action } from '../action/action';
import { createId, Id } from '../id/id';
import { Money } from '../money/money';
import { Version } from '../version/version';
import { Authflow } from './authflow';
import { authflowFromTemplate } from './authflow-from-template';
import { AuthflowTemplate } from './authflow-template';
import { noOverlappingRanges } from './checks/check-no-overlapping-ranges';
import { templateInRange } from './checks/check-template-in-range';

export type AuthflowPolicy = {
    id: Id;
    action: Action;
    templates: AuthflowTemplate[];
    version: Version;
};

export type AuthflowPolicyInput = {
    action: Action;
    templates: AuthflowTemplate[];
};

type RebuildAuthflowPolicyInput = AuthflowPolicyInput & { id: Id; version: Version };

const buildAuthflowPolicy = applySpec<AuthflowPolicy>({
    id: () => createId(),
    action: prop('action'),
    templates: prop('templates'),
    version: () => 0,
});

const rebuildAuthflowPolicy = applySpec<AuthflowPolicy>({
    id: prop('id'),
    action: prop('action'),
    templates: prop('templates'),
    version: prop('version'),
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

type SelectAuthflowInput = {
    policy: AuthflowPolicy;
    amount: Money;
};

const buildAuthflow = (data: SelectAuthflowInput): Result<DomainError, Authflow> => {
    const matched = data.policy.templates.find(
        (t) =>
            Number(data.amount.amount) >= Number(t.range.from.amount) &&
            Number(data.amount.amount) <= Number(t.range.to.amount)
    )!;
    return authflowFromTemplate(data.policy.action, matched);
};

export const selectAuthflow = (
    policy: AuthflowPolicy,
    amount: Money
): Result<DomainError, Authflow> =>
    Result.ok<DomainError, SelectAuthflowInput>({ policy, amount })
        .flatMap(templateInRange)
        .flatMap(buildAuthflow);
