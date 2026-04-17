import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';
import { Approver } from '../../approver/approver.ts';

export function checkTemplateApproversNotEmpty(
    approvers: Approver[]
): AppKnownError | null {
    if (approvers.length === 0) {
        return new AppKnownError({
            message: 'Approvers array cannot be empty',
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY,
        });
    }

    return null;
}
