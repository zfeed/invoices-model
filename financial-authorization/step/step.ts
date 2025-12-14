import { randomUUID } from 'crypto';
import { all, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Group } from '../groups/group';
import { checkOrderNonNegative } from './checks/check-order-non-negative';

export type Step = {
    id: string;
    order: number;
    isApproved: boolean;
    groups: Group[];
};

export function createStep(data: {
    id: string;
    order: number;
    groups: Group[];
}): Result<DomainError, Step> {
    const orderError = checkOrderNonNegative(data.order);
    if (orderError) {
        return Result.error(orderError);
    }

    const isApproved = all(prop('isApproved'), data.groups);

    return Result.ok({
        id: randomUUID(),
        order: data.order,
        isApproved,
        groups: data.groups,
    });
}
