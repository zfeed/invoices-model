import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Email } from '../email/email';
import { Name } from '../name/name';
import { createId, Id } from '../id/id';
import { emailHasValidFormat } from './checks/check-email-format';

export type Approver = {
    id: Id;
    name: Name;
    email: Email;
};

type ApproverInput = {
    name: Name;
    email: Email;
};

const buildApprover = applySpec<Approver>({
    id: () => createId(),
    name: prop('name'),
    email: prop('email'),
});

export const createApprover = (
    data: ApproverInput
): Result<DomainError, Approver> =>
    Result.ok<DomainError, ApproverInput>(data)
        .flatMap(emailHasValidFormat)
        .map(buildApprover);
