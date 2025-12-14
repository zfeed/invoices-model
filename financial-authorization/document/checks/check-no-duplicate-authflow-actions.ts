import { length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Authflow } from '../../authflow/authflow';

export function checkNoDuplicateAuthflowActions(
    authflows: Authflow[]
): DomainError | null {
    // Extract all authflow actions
    const actions = map(prop('action'), authflows);

    // Remove duplicates and compare lengths
    // If uniq removes any items, there were duplicates
    const uniqueActions = uniq(actions);

    const hasDuplicates = length(actions) !== length(uniqueActions);

    if (hasDuplicates) {
        return new DomainError({
            message: 'Duplicate authflow actions found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE,
        });
    }

    return null;
}

