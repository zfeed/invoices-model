import { ifElse, length, map, pipe, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Approval } from '../../approval/approval';
import { Approver } from '../../approver/approver';

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

const getApproverIds = (data: GroupInput) => map(prop('id'), data.approvers);
const hasDuplicates = <T>(items: T[]) => length(items) !== length(uniq(items));
const approversHaveDuplicates = pipe(getApproverIds, hasDuplicates);

const createDuplicateApproversError = () =>
    Result.error(
        new DomainError({
            message: 'Duplicate approver IDs found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
        })
    );

export function approversNotDuplicated(data: GroupInput) {
    return Result.ok<DomainError, GroupInput>(data).flatMap(
        ifElse(
            approversHaveDuplicates,
            createDuplicateApproversError,
            Result.ok
        )
    );
}
