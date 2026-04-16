import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { Approval } from '../../approval/approval.ts';
import { Approver } from '../../approver/approver.ts';

export function checkApproverExists(
    approvers: Approver[],
    approvals: Approval[]
): DomainError | null {
    const approverIds = approvers.map((a) => a.id.toPlain());

    for (const approval of approvals) {
        if (!approverIds.includes(approval.approverId.toPlain())) {
            return new DomainError({
                message: `Approval references non-existent approver ID: ${approval.approverId.toPlain()}`,
                code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND,
            });
        }
    }

    return null;
}
