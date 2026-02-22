import { ifElse } from 'ramda';
import { isEmail } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';

const emailInvalid = (value: string) => !isEmail(value);
const createEmailInvalidError = () =>
    Result.error(
        new DomainError({
            message: 'Invalid email',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
        })
    );

export function emailHasValidFormat(value: string) {
    return Result.ok<DomainError, string>(value).flatMap(
        ifElse(emailInvalid, createEmailInvalidError, Result.ok)
    );
}
