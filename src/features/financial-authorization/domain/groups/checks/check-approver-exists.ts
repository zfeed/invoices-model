import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';
import { Approval } from '../../approval/approval.ts';
import { Approver } from '../../approver/approver.ts';

export function checkApproverExists(
    approvers: Approver[],
    approvals: Approval[]
): AppKnownError | null {
    const approverIds = approvers.map((a) => a.id.toPlain());

    for (const approval of approvals) {
        if (!approverIds.includes(approval.approverId.toPlain())) {
            return new AppKnownError({
                message: `Approval references non-existent approver ID: ${approval.approverId.toPlain()}`,
                code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND,
            });
        }
    }

    return null;
}
