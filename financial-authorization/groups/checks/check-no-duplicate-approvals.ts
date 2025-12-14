import { length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Approval } from '../../approval/approval';

export function checkNoDuplicateApprovals(
    approvals: Approval[]
): DomainError | null {
    // Extract all approver IDs from approvals
    const approverIds = map(prop('approverId'), approvals);

    // Remove duplicates and compare lengths
    // If uniq removes any items, there were duplicates
    const uniqueIds = uniq(approverIds);

    const hasDuplicates = length(approverIds) !== length(uniqueIds);

    if (hasDuplicates) {
        return new DomainError({
            message: 'Duplicate approver IDs found in approvals',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE,
        });
    }

    return null;
}
