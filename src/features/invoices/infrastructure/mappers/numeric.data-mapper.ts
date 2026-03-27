import { Numeric } from '../../domain/numeric/numeric';

export type NumericRecord = {
    value: string;
};

export class NumericDataMapper extends Numeric {
    static from(numeric: Numeric): NumericDataMapper {
        return Object.setPrototypeOf(
            numeric,
            NumericDataMapper.prototype
        ) as NumericDataMapper;
    }

    static fromRecord(record: NumericRecord): NumericDataMapper {
        return new NumericDataMapper(record.value);
    }

    toRecord(): NumericRecord {
        return {
            value: this._value.toString(),
        };
    }
}
