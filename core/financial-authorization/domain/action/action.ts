import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { actionIsNotBlank } from './checks/check-action-not-blank';

export type Action = string;

export const createAction = (value: string): Result<DomainError, Action> =>
    Result.ok<DomainError, string>(value).flatMap(actionIsNotBlank);
