import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';
import { Authflow } from '../../authflow/authflow';

export function checkNoDuplicateAuthflowActions(
    authflows: Authflow[]
): DomainError | null {
    const actions = authflows.map((a) => a.action.toPlain());
    const uniqueActions = new Set(actions);

    if (actions.length !== uniqueActions.size) {
        return new DomainError({
            message: 'Duplicate authflow actions found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE,
        });
    }

    return null;
}
