import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { GroupTemplate, groupsFromTemplates } from '../groups/group-template';
import { createStep, Step } from './step';
import { createId, Id } from '../id/id';
import { createOrder, Order } from '../order/order';

export type StepTemplate = {
    id: Id;
    order: Order;
    groups: GroupTemplate[];
};

export type StepTemplateInput = {
    order: number;
    groups: GroupTemplate[];
};

type ValidatedStepTemplateInput = {
    order: Order;
    groups: GroupTemplate[];
};

type RebuildStepTemplateInput = ValidatedStepTemplateInput & { id: Id };

const buildStepTemplate = applySpec<StepTemplate>({
    id: () => createId(),
    order: prop('order'),
    groups: prop('groups'),
});

const rebuildStepTemplate = applySpec<StepTemplate>({
    id: prop('id'),
    order: prop('order'),
    groups: prop('groups'),
});

export const createStepTemplate = (
    data: StepTemplateInput
): Result<DomainError, StepTemplate> =>
    createOrder(data.order)
        .map(
            (order): ValidatedStepTemplateInput => ({
                order,
                groups: data.groups,
            })
        )
        .map(buildStepTemplate);

export const recreateStepTemplate = (
    data: RebuildStepTemplateInput
): Result<DomainError, StepTemplate> =>
    createOrder(data.order)
        .map((order): RebuildStepTemplateInput => ({ ...data, order }))
        .map(rebuildStepTemplate);

export const stepFromTemplate = (
    template: StepTemplate
): Result<DomainError, Step> =>
    groupsFromTemplates(template.groups).flatMap((groups) =>
        createStep({ order: template.order, groups })
    );

export const stepsFromTemplates = (
    templates: StepTemplate[]
): Result<DomainError, Step[]> =>
    templates.reduce<Result<DomainError, Step[]>>(
        (acc, template) =>
            acc.flatMap((steps) =>
                stepFromTemplate(template).map((step) => [...steps, step])
            ),
        Result.ok([])
    );
