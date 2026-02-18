import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { IO } from '../../../../building-blocks/io';
import { Result } from '../../../../building-blocks/result';
import { Some } from '../../../../building-blocks/some';
import { FinancialDocument } from '../../domain/document/document';
import { ReferenceId } from '../../domain/reference-id/reference-id';

export interface DocumentStorage {
    findByReferenceId(referenceId: ReferenceId): IO<Some<FinancialDocument>>;
    save(
        document: FinancialDocument
    ): IO<Result<DomainError, FinancialDocument>>;
}
