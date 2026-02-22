import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { emailHasValidFormat } from './checks/check-email-format';

export type Email = string;

export const createEmail = (value: string): Result<DomainError, Email> =>
    Result.ok<DomainError, string>(value).flatMap(emailHasValidFormat);
