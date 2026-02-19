import { ifElse, length, map, pipe, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Approver } from '../../approver/approver';

type GroupTemplateInput = {
    approvers: Approver[];
};

const getApproverIds = (data: GroupTemplateInput) =>
    map(prop('id'), data.approvers);
const hasDuplicates = <T>(items: T[]) => length(items) !== length(uniq(items));
const approversHaveDuplicates = pipe(getApproverIds, hasDuplicates);

const createDuplicateApproversError = () =>
    Result.error(
        new DomainError({
            message: 'Duplicate approver IDs found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
        })
    );

export function templateApproversNotDuplicated(data: GroupTemplateInput) {
    return Result.ok<DomainError, GroupTemplateInput>(data).flatMap(
        ifElse(
            approversHaveDuplicates,
            createDuplicateApproversError,
            Result.ok
        )
    );
}
