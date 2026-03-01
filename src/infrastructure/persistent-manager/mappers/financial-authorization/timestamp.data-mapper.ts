import { Timestamp } from '../../../../core/financial-authorization/domain/timestamp/timestamp';

export type TimestampRecord = {
    value: string;
};

export class TimestampDataMapper extends Timestamp {
    static from(timestamp: Timestamp): TimestampDataMapper {
        return Object.setPrototypeOf(
            timestamp,
            TimestampDataMapper.prototype
        ) as TimestampDataMapper;
    }

    static fromRecord(record: TimestampRecord): TimestampDataMapper {
        return new TimestampDataMapper(new Date(record.value));
    }

    toRecord(): TimestampRecord {
        return {
            value: this._value.toISOString(),
        };
    }
}
