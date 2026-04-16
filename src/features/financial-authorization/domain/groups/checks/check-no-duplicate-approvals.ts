import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { Approval } from '../../approval/approval.ts';

export function checkNoDuplicateApprovals(
    approvals: Approval[]
): DomainError | null {
    const ids = approvals.map((a) => a.approverId.toPlain());
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        return new DomainError({
            message: 'Duplicate approver IDs found in approvals',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE,
        });
    }

    return null;
}
