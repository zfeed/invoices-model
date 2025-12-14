import { randomUUID } from 'crypto';
import { all, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Step } from '../step/step';
import { checkNoDuplicateStepOrders } from './checks/check-no-duplicate-step-orders';

export type Authflow = {
    id: string;
    action: string;
    isApproved: boolean;
    steps: Step[];
};

export function createAuthflow(data: {
    action: string;
    steps: Step[];
}): Result<DomainError, Authflow> {
    const duplicateStepOrdersError = checkNoDuplicateStepOrders(data.steps);
    if (duplicateStepOrdersError) {
        return Result.error(duplicateStepOrdersError);
    }

    const isApproved = all(prop('isApproved'), data.steps);

    return Result.ok({
        id: randomUUID(),
        action: data.action,
        isApproved,
        steps: data.steps,
    });
}
