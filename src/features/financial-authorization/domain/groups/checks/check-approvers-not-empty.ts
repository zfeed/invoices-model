import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { Approver } from '../../approver/approver.ts';

export function checkApproversNotEmpty(
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
