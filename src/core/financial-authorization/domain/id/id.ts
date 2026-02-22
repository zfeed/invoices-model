import { randomUUID } from 'crypto';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { idIsNotBlank } from './checks/check-id-not-blank';

export type Id = string;

export function createId(): Id {
    return randomUUID();
}

export const fromString = (value: string): Result<DomainError, Id> =>
    Result.ok<DomainError, string>(value).flatMap(idIsNotBlank);
