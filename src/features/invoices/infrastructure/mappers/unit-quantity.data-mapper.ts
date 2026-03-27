import { UnitQuantity } from '../../domain/line-item/unit-quantity/unit-quantity';
import { NumericDataMapper, NumericRecord } from './numeric.data-mapper';

export type UnitQuantityRecord = {
    value: NumericRecord;
};

export class UnitQuantityDataMapper extends UnitQuantity {
    static from(unitQuantity: UnitQuantity): UnitQuantityDataMapper {
        return Object.setPrototypeOf(
            unitQuantity,
            UnitQuantityDataMapper.prototype
        ) as UnitQuantityDataMapper;
    }

    static fromRecord(record: UnitQuantityRecord): UnitQuantityDataMapper {
        return new UnitQuantityDataMapper(
            NumericDataMapper.fromRecord(record.value)
        );
    }

    toRecord(): UnitQuantityRecord {
        return {
            value: NumericDataMapper.from(this._value).toRecord(),
        };
    }
}
