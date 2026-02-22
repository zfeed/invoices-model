import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { createGroup, Group } from './group';
import { Approver } from '../approver/approver';
import { createId, Id } from '../id/id';
import { templateApproversNotEmpty } from './checks/check-template-approvers-not-empty';
import { templateApproversNotDuplicated } from './checks/check-template-no-duplicate-approvers';

export type GroupTemplate = {
    id: Id;
    approvers: Approver[];
};

export type GroupTemplateInput = {
    approvers: Approver[];
};

type RebuildGroupTemplateInput = GroupTemplateInput & { id: Id };

const buildGroupTemplate = applySpec<GroupTemplate>({
    id: () => createId(),
    approvers: prop('approvers'),
});

const rebuildGroupTemplate = applySpec<GroupTemplate>({
    id: prop('id'),
    approvers: prop('approvers'),
});

export const createGroupTemplate = (
    data: GroupTemplateInput
): Result<DomainError, GroupTemplate> =>
    Result.ok<DomainError, GroupTemplateInput>(data)
        .flatMap(templateApproversNotEmpty)
        .flatMap(templateApproversNotDuplicated)
        .map(buildGroupTemplate);

export const recreateGroupTemplate = (
    data: RebuildGroupTemplateInput
): Result<DomainError, GroupTemplate> =>
    Result.ok<DomainError, RebuildGroupTemplateInput>(data)
        .flatMap(templateApproversNotEmpty)
        .flatMap(templateApproversNotDuplicated)
        .map(rebuildGroupTemplate);

export const groupFromTemplate = (
    template: GroupTemplate
): Result<DomainError, Group> =>
    createGroup({
        approvers: template.approvers,
        approvals: [],
    });

export const groupsFromTemplates = (
    templates: GroupTemplate[]
): Result<DomainError, Group[]> =>
    templates.reduce<Result<DomainError, Group[]>>(
        (acc, template) =>
            acc.flatMap((groups) =>
                groupFromTemplate(template).map((group) => [...groups, group])
            ),
        Result.ok([])
    );
