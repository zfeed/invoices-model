import { applySpec, map, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { createId, Id } from '../id/id';
import { PlainRange, Range, rangeToPlain } from '../range/range';
import { PlainStepTemplate, StepTemplate, stepTemplateToPlain } from '../step/step-template';
import { templateNoDuplicateStepOrders } from './checks/check-template-no-duplicate-step-orders';

export type AuthflowTemplate = {
    id: Id;
    range: Range;
    steps: StepTemplate[];
};

export type AuthflowTemplateInput = {
    range: Range;
    steps: StepTemplate[];
};

type RebuildAuthflowTemplateInput = AuthflowTemplateInput & { id: Id };

const buildAuthflowTemplate = applySpec<AuthflowTemplate>({
    id: () => createId(),
    range: prop('range'),
    steps: prop('steps'),
});

const rebuildAuthflowTemplate = applySpec<AuthflowTemplate>({
    id: prop('id'),
    range: prop('range'),
    steps: prop('steps'),
});

export type PlainAuthflowTemplate = {
    id: string;
    range: PlainRange;
    steps: PlainStepTemplate[];
};

export const authflowTemplateToPlain = (template: AuthflowTemplate): PlainAuthflowTemplate => ({
    id: template.id,
    range: rangeToPlain(template.range),
    steps: map(stepTemplateToPlain, template.steps),
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
