import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Approval } from '../../approval/approval';

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
