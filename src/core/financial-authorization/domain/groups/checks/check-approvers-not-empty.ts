import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Approver } from '../../approver/approver';

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
