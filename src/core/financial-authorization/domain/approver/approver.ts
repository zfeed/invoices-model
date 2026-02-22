import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { createEmail, Email } from '../email/email';
import { createName, Name } from '../name/name';
import { createId, Id } from '../id/id';

export type Approver = {
    id: Id;
    name: Name;
    email: Email;
};

type ApproverInput = {
    name: string;
    email: string;
};

const buildApprover = applySpec<Approver>({
    id: () => createId(),
    name: prop('name'),
    email: prop('email'),
});

export const createApprover = (
    data: ApproverInput
): Result<DomainError, Approver> =>
    createName(data.name).flatMap((name) =>
        createEmail(data.email)
            .map((email) => ({ name, email }))
            .map(buildApprover)
    );
