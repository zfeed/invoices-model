import { Range } from '../../../../core/financial-authorization/domain/range/range';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper';

export type RangeRecord = {
    from: MoneyRecord;
    to: MoneyRecord;
};

export class RangeDataMapper extends Range {
    static from(range: Range): RangeDataMapper {
        return Object.setPrototypeOf(
            range,
            RangeDataMapper.prototype
        ) as RangeDataMapper;
    }

    static fromRecord(record: RangeRecord): RangeDataMapper {
        return new RangeDataMapper(
            MoneyDataMapper.fromRecord(record.from),
            MoneyDataMapper.fromRecord(record.to)
        );
    }

    toRecord(): RangeRecord {
        return {
            from: MoneyDataMapper.from(this._from).toRecord(),
            to: MoneyDataMapper.from(this._to).toRecord(),
        };
    }
}
