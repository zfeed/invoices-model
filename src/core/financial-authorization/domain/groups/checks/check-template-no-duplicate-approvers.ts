import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Approver } from '../../approver/approver';

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
