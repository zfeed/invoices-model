import { Name } from '../../domain/name/name.ts';

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
