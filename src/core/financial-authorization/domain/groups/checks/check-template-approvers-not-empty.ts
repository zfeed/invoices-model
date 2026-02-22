import { ifElse, isEmpty } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Approver } from '../../approver/approver';

type GroupTemplateInput = {
    approvers: Approver[];
};

const approversEmpty = (data: GroupTemplateInput) => isEmpty(data.approvers);
const createApproversEmptyError = () =>
    Result.error(
        new DomainError({
            message: 'Approvers array cannot be empty',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY,
        })
    );

export function templateApproversNotEmpty(data: GroupTemplateInput) {
    return Result.ok<DomainError, GroupTemplateInput>(data).flatMap(
        ifElse(approversEmpty, createApproversEmptyError, Result.ok)
    );
}
