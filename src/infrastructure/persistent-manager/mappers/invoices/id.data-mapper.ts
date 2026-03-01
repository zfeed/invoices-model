import { Id } from '../../../../core/invoices/domain/id/id';

export type IdRecord = {
    value: string;
};

export class IdDataMapper extends Id {
    static from(id: Id): IdDataMapper {
        return Object.setPrototypeOf(
            id,
            IdDataMapper.prototype
        ) as IdDataMapper;
    }

    static fromRecord(record: IdRecord): IdDataMapper {
        return new IdDataMapper(record.value);
    }

    toRecord(): IdRecord {
        return {
            value: this._value,
        };
    }
}
