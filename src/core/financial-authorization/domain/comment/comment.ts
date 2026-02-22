import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { commentIsNotBlank } from './checks/check-comment-not-blank';

export type Comment = string | null;

export const createComment = (
    value: string | null
): Result<DomainError, Comment> =>
    value === null
        ? Result.ok(value)
        : Result.ok<DomainError, string>(value).flatMap(commentIsNotBlank);
