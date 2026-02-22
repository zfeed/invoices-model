import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Email } from '../../email/email';
import { Name } from '../../name/name';

type ApproverInput = {
    name: Name;
    email: Email;
};

const nameIsBlank = (data: ApproverInput) => !data.name.trim();
const createNameBlankError = () =>
    Result.error(
        new DomainError({
            message: 'Name cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK,
        })
    );

export function nameIsNotBlank(data: ApproverInput) {
    return Result.ok<DomainError, ApproverInput>(data).flatMap(
        ifElse(nameIsBlank, createNameBlankError, Result.ok)
    );
}
