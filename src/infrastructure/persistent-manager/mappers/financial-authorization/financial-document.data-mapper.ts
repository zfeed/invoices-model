import { FinancialDocument } from '../../../../core/financial-authorization/domain/document/document';
import { AuthflowDataMapper, AuthflowRecord } from './authflow.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper';
import {
    ReferenceIdDataMapper,
    ReferenceIdRecord,
} from './reference-id.data-mapper';

export type FinancialDocumentRecord = {
    id: IdRecord;
    referenceId: ReferenceIdRecord;
    value: MoneyRecord;
    authflows: AuthflowRecord[];
};

export class FinancialDocumentDataMapper extends FinancialDocument {
    static from(document: FinancialDocument): FinancialDocumentDataMapper {
        return Object.setPrototypeOf(
            document,
            FinancialDocumentDataMapper.prototype
        ) as FinancialDocumentDataMapper;
    }

    static fromRecord(
        record: FinancialDocumentRecord
    ): FinancialDocumentDataMapper {
        return new FinancialDocumentDataMapper(
            IdDataMapper.fromRecord(record.id),
            ReferenceIdDataMapper.fromRecord(record.referenceId),
            MoneyDataMapper.fromRecord(record.value),
            record.authflows.map((a) => AuthflowDataMapper.fromRecord(a))
        );
    }

    toRecord(): FinancialDocumentRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            referenceId: ReferenceIdDataMapper.from(
                this._referenceId
            ).toRecord(),
            value: MoneyDataMapper.from(this._value).toRecord(),
            authflows: this._authflows.map((a) =>
                AuthflowDataMapper.from(a).toRecord()
            ),
        };
    }
}
