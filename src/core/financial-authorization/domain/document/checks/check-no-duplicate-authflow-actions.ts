import { KNOWN_ERROR_CODE } from '../../../../bulding-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../bulding-blocks/errors/app-known-error.ts';
import { Authflow } from '../../authflow/authflow.ts';

export function checkNoDuplicateAuthflowActions(
    authflows: Authflow[]
): AppKnownError | null {
    const actions = authflows.map((a) => a.action.toPlain());
    const uniqueActions = new Set(actions);

    if (actions.length !== uniqueActions.size) {
        return new AppKnownError({
            message: 'Duplicate authflow actions found',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE,
        });
    }

    return null;
}
