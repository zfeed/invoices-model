import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes';
import { DomainError } from '../../../../../shared/errors/domain/domain.error';
import { Approver } from '../../approver/approver';

export function checkTemplateApproversNotEmpty(
    approvers: Approver[]
): DomainError | null {
    if (approvers.length === 0) {
        return new DomainError({
            message: 'Approvers array cannot be empty',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY,
        });
    }

    return null;
}
