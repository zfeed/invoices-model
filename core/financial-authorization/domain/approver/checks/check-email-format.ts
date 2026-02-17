import { ifElse } from 'ramda';
import { isEmail } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Email } from '../../email/email';
import { Name } from '../../name/name';

type ApproverInput = {
    name: Name;
    email: Email;
};

const emailInvalid = (data: ApproverInput) => !isEmail(data.email);
const createEmailInvalidError = () =>
    Result.error(
        new DomainError({
            message: 'Invalid email',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
        })
    );

export function emailHasValidFormat(data: ApproverInput) {
    return Result.ok<DomainError, ApproverInput>(data).flatMap(
        ifElse(emailInvalid, createEmailInvalidError, Result.ok)
    );
}
