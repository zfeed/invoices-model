import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { nameIsNotBlank } from './checks/check-name-not-blank';

export type Name = string;

export const createName = (value: string): Result<DomainError, Name> =>
    Result.ok<DomainError, string>(value).flatMap(nameIsNotBlank);
