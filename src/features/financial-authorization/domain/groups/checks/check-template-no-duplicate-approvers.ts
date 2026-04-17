import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';
import { Approver } from '../../approver/approver.ts';

export function checkTemplateNoDuplicateApprovers(
    approvers: Approver[]
): AppKnownError | null {
    const ids = approvers.map((a) => a.id.toPlain());
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        return new AppKnownError({
            message: 'Duplicate approver IDs found',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
        });
    }

    return null;
}
