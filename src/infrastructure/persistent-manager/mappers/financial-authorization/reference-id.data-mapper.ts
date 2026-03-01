import { ReferenceId } from '../../../../core/financial-authorization/domain/reference-id/reference-id';

export type ReferenceIdRecord = {
    value: string;
};

export class ReferenceIdDataMapper extends ReferenceId {
    static from(referenceId: ReferenceId): ReferenceIdDataMapper {
        return Object.setPrototypeOf(
            referenceId,
            ReferenceIdDataMapper.prototype
        ) as ReferenceIdDataMapper;
    }

    static fromRecord(record: ReferenceIdRecord): ReferenceIdDataMapper {
        return new ReferenceIdDataMapper(record.value);
    }

    toRecord(): ReferenceIdRecord {
        return {
            value: this._value,
        };
    }
}
