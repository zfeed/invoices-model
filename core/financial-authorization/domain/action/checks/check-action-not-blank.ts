import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';

const isBlank = (value: string) => !value.trim();
const createBlankError = () =>
    Result.error(
        new DomainError({
            message: 'Action cannot be blank',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK,
        })
    );

export function actionIsNotBlank(value: string) {
    return Result.ok<DomainError, string>(value).flatMap(
        ifElse(isBlank, createBlankError, Result.ok)
    );
}
