import { applySpec, map, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { WithEvents, withEvents } from '../../../../building-blocks/events/with-events';
import { Action } from '../action/action';
import { createId, Id } from '../id/id';
import { Money } from '../money/money';
import { Version } from '../version/version';
import { Authflow } from './authflow';
import { authflowFromTemplate } from './authflow-from-template';
import { AuthflowTemplate, PlainAuthflowTemplate, authflowTemplateToPlain } from './authflow-template';
import { noOverlappingRanges } from './checks/check-no-overlapping-ranges';
import { templateInRange } from './checks/check-template-in-range';
import { AuthflowPolicyCreatedEvent } from './events/authflow-policy-created.event';

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

export type PlainAuthflowPolicy = {
    id: string;
    action: string;
    templates: PlainAuthflowTemplate[];
    version: number;
};

export const authflowPolicyToPlain = (policy: AuthflowPolicy): PlainAuthflowPolicy => ({
    id: policy.id,
    action: policy.action,
    templates: map(authflowTemplateToPlain, policy.templates),
    version: policy.version,
});

export const createAuthflowPolicy = (
    data: AuthflowPolicyInput
): Result<DomainError, WithEvents<AuthflowPolicy, AuthflowPolicyCreatedEvent>> =>
    Result.ok<DomainError, AuthflowPolicyInput>(data)
        .flatMap(noOverlappingRanges)
        .map(buildAuthflowPolicy)
        .map((policy) =>
            withEvents(policy, [new AuthflowPolicyCreatedEvent(policy)])
        );

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
