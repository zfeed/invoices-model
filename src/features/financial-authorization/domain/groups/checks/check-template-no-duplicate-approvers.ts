import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { Approver } from '../../approver/approver.ts';

export function checkTemplateNoDuplicateApprovers(
    approvers: Approver[]
): DomainError | null {
    const ids = approvers.map((a) => a.id.toPlain());
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        return new DomainError({
            message: 'Duplicate approver IDs found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
        });
    }

    return null;
}
