import { ifElse, isEmpty } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Approval } from '../../approval/approval';
import { Approver } from '../../approver/approver';

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

const approversEmpty = (data: GroupInput) => isEmpty(data.approvers);
const createApproversEmptyError = () =>
    Result.error(
        new DomainError({
            message: 'Approvers array cannot be empty',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY,
        })
    );

export function approversNotEmpty(data: GroupInput) {
    return Result.ok<DomainError, GroupInput>(data).flatMap(
        ifElse(approversEmpty, createApproversEmptyError, Result.ok)
    );
}
