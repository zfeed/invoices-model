import { randomUUID } from 'crypto';
import { applySpec, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Group } from '../groups/group';
import { orderNonNegative } from './checks/check-order-non-negative';

export type Step = {
    id: string;
    order: number;
    isApproved: boolean;
    groups: Group[];
};

type StepInput = {
    order: number;
    groups: Group[];
};

const allGroupsApproved = (data: StepInput) =>
    data.groups.every((group) => group.isApproved);

const buildStep = applySpec<Step>({
    id: () => randomUUID(),
    order: prop('order'),
    isApproved: allGroupsApproved,
    groups: prop('groups'),
});

export const createStep = (data: StepInput): Result<DomainError, Step> =>
    Result.ok<DomainError, StepInput>(data)
        .flatMap(orderNonNegative)
        .map(buildStep);
