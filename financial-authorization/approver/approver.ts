import { randomUUID } from 'crypto';
import { ifElse } from 'ramda';
import { isEmail } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';

export type Approver = {
    id: string;
    name: string;
    email: string;
};

export function createApprover(data: {
    name: string;
    email: string;
}): Result<DomainError, Approver> {
    const isValidEmail = () => isEmail(data.email);

    const createApprover = () =>
        Result.ok({
            id: randomUUID(),
            name: data.name,
            email: data.email,
        });

    const createErrorResult = () =>
        Result.error(
            new DomainError({
                message: 'Invalid email',
                code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
            })
        );

    return ifElse(isValidEmail, createApprover, createErrorResult)();
}
