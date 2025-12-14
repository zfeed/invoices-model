import { complement, find, flip, includes, map, pipe, prop } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Approval } from '../../approval/approval';
import { Approver } from '../../approver/approver';

const createApproverNotFoundError = (approval: Approval): DomainError =>
    new DomainError({
        message: `Approval references non-existent approver ID: ${approval.approverId}`,
        code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND,
    });

const findInvalidApproval =
    (approverIds: string[]) =>
    (approvals: Approval[]): Approval | undefined =>
        find(
            pipe(prop('approverId'), complement(flip(includes)(approverIds))),
            approvals
        );

const convertInvalidApprovalToError = (
    approval: Approval | undefined
): DomainError | null => {
    if (!approval) return null;
    return createApproverNotFoundError(approval);
};

export function checkApproverExists(
    approvers: Approver[],
    approvals: Approval[]
): DomainError | null {
    const approverIds = map(prop('id'), approvers);
    const invalidApproval = findInvalidApproval(approverIds)(approvals);

    return convertInvalidApprovalToError(invalidApproval);
}
