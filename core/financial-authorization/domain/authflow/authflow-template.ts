import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Action } from '../action/action';
import { createId, Id } from '../id/id';
import { Range } from '../range/range';
import { StepTemplate } from '../step/step-template';
import { templateNoDuplicateStepOrders } from './checks/check-template-no-duplicate-step-orders';

export type AuthflowTemplate = {
    id: Id;
    action: Action;
    range: Range;
    steps: StepTemplate[];
};

export type AuthflowTemplateInput = {
    action: Action;
    range: Range;
    steps: StepTemplate[];
};

type RebuildAuthflowTemplateInput = AuthflowTemplateInput & { id: Id };

const buildAuthflowTemplate = applySpec<AuthflowTemplate>({
    id: () => createId(),
    action: prop('action'),
    range: prop('range'),
    steps: prop('steps'),
});

const rebuildAuthflowTemplate = applySpec<AuthflowTemplate>({
    id: prop('id'),
    action: prop('action'),
    range: prop('range'),
    steps: prop('steps'),
});

export const createAuthflowTemplate = (
    data: AuthflowTemplateInput
): Result<DomainError, AuthflowTemplate> =>
    Result.ok<DomainError, AuthflowTemplateInput>(data)
        .flatMap(templateNoDuplicateStepOrders)
        .map(buildAuthflowTemplate);

export const recreateAuthflowTemplate = (
    data: RebuildAuthflowTemplateInput
): Result<DomainError, AuthflowTemplate> =>
    Result.ok<DomainError, RebuildAuthflowTemplateInput>(data)
        .flatMap(templateNoDuplicateStepOrders)
        .map(rebuildAuthflowTemplate);
