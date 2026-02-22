import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { referenceIdIsNotBlank } from './checks/check-reference-id-not-blank';

export type ReferenceId = string;

export const createReferenceId = (
    value: string
): Result<DomainError, ReferenceId> =>
    Result.ok<DomainError, string>(value).flatMap(referenceIdIsNotBlank);
