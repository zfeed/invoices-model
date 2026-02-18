import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { IO } from '../../building-blocks/io';
import { Result } from '../../building-blocks/result';
import { Some } from '../../building-blocks/some';
import { DocumentStorage } from '../../core/financial-authorization/application/storage/io';
import { FinancialDocument } from '../../core/financial-authorization/domain/document/document';
import { ReferenceId } from '../../core/financial-authorization/domain/reference-id/reference-id';
import { Store } from '../store/store';

export class InMemoryDocumentStorage implements DocumentStorage {
    private readonly store = new Store<FinancialDocument>();

    findByReferenceId(referenceId: ReferenceId): IO<Some<FinancialDocument>> {
        return IO.from(async () => {
            const record = this.store.get(referenceId);

            if (!record) {
                return Some.none();
            }

            return Some.of({ ...record.value, version: record.version });
        });
    }

    save(
        document: FinancialDocument
    ): IO<Result<DomainError, FinancialDocument>> {
        return IO.from(async () => {
            const expectedVersion =
                document.version === 0 ? null : document.version;

            const newVersion = this.store.setIfVersion(
                document.referenceId,
                document,
                expectedVersion
            );

            return Result.ok({ ...document, version: newVersion });
        });
    }
}
