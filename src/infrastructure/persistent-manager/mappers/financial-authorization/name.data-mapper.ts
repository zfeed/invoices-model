import { Name } from '../../../../core/financial-authorization/domain/name/name';

export type NameRecord = {
    value: string;
};

export class NameDataMapper extends Name {
    static from(name: Name): NameDataMapper {
        return Object.setPrototypeOf(
            name,
            NameDataMapper.prototype
        ) as NameDataMapper;
    }

    static fromRecord(record: NameRecord): NameDataMapper {
        return new NameDataMapper(record.value);
    }

    toRecord(): NameRecord {
        return {
            value: this._value,
        };
    }
}
