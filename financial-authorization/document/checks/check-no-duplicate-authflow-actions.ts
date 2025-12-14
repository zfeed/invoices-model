import { ifElse, length, map, pipe, prop, uniq } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../building-blocks/result';
import { Authflow } from '../../authflow/authflow';

type DocumentInput = {
    referenceId: string;
    authflows: Authflow[];
};

const getActions = (data: DocumentInput) => map(prop('action'), data.authflows);
const hasDuplicates = <T>(items: T[]) => length(items) !== length(uniq(items));
const authflowsHaveDuplicateActions = pipe(getActions, hasDuplicates);

const createDuplicateActionsError = () =>
    Result.error(
        new DomainError({
            message: 'Duplicate authflow actions found',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE,
        })
    );

export function noDuplicateAuthflowActions(data: DocumentInput) {
    return Result.ok<DomainError, DocumentInput>(data).flatMap(
        ifElse(
            authflowsHaveDuplicateActions,
            createDuplicateActionsError,
            Result.ok
        )
    );
}
