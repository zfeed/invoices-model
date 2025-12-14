import {
    complement,
    find,
    flip,
    ifElse,
    includes,
    map,
    pipe,
    prop,
} from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Approval } from '../../approval/approval';
import { Approver } from '../../approver/approver';

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

const findInvalidApproval = (data: GroupInput): Approval | undefined => {
    const approverIds = map(prop('id'), data.approvers);
    return find(
        pipe(prop('approverId'), complement(flip(includes)(approverIds))),
        data.approvals
    );
};

const hasInvalidApproval = (data: GroupInput) =>
    findInvalidApproval(data) !== undefined;

const createApproverNotFoundError = (data: GroupInput) => {
    const invalidApproval = findInvalidApproval(data)!;
    return Result.error(
        new DomainError({
            message: `Approval references non-existent approver ID: ${invalidApproval.approverId}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND,
        })
    );
};

export function approvalReferencesExistingApprover(data: GroupInput) {
    return Result.ok<DomainError, GroupInput>(data).flatMap(
        ifElse(hasInvalidApproval, createApproverNotFoundError, Result.ok)
    );
}
