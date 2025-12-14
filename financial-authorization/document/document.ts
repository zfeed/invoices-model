import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Authflow } from '../authflow/authflow';
import { checkNoDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions';

type FinancialDocument = {
    id: string;
    referenceId: string;
    authflows: Authflow[];
};

export function createDocument(data: {
    id: string;
    referenceId: string;
    authflows: Authflow[];
}): Result<DomainError, FinancialDocument> {
    const duplicateActionsError = checkNoDuplicateAuthflowActions(
        data.authflows
    );
    if (duplicateActionsError) {
        return Result.error(duplicateActionsError);
    }

    return Result.ok({
        id: data.id,
        referenceId: data.referenceId,
        authflows: data.authflows,
    });
}
