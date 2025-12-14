import { length, map, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Approver } from '../../approver/approver';

export function checkNoDuplicateApprovers(
    approvers: Approver[]
): DomainError | null {
    // Extract all approver IDs
    const approverIds = map(prop('id'), approvers);

    // Remove duplicates and compare lengths
    // If uniq removes any items, there were duplicates
    const uniqueIds = uniq(approverIds);

    const hasDuplicates = length(approverIds) !== length(uniqueIds);

    if (hasDuplicates) {
        return new DomainError({
            message: 'Duplicate approver IDs found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
        });
    }

    return null;
}
