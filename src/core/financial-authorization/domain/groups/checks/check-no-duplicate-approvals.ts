import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';
import { Approval } from '../../approval/approval.ts';

export function checkNoDuplicateApprovals(
    approvals: Approval[]
): AppKnownError | null {
    const ids = approvals.map((a) => a.approverId.toPlain());
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        return new AppKnownError({
            message: 'Duplicate approver IDs found in approvals',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE,
        });
    }

    return null;
}
