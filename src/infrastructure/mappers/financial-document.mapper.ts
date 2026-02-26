import { FinancialDocument } from '../../core/financial-authorization/domain/document/document';
import { Mapper } from './mapper';

type FinancialDocumentPlain = ReturnType<FinancialDocument['toPlain']>;

class FinancialDocumentMapper extends Mapper<
    FinancialDocument,
    FinancialDocumentPlain
> {
    entityClass() {
        return FinancialDocument;
    }

    toPlain(document: FinancialDocument): FinancialDocumentPlain {
        return document.toPlain();
    }

    toDomain(plain: FinancialDocumentPlain): FinancialDocument {
        return FinancialDocument.fromPlain(plain);
    }
}

new FinancialDocumentMapper();
