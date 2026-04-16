import { VatRate } from '../../domain/vat-rate/vat-rate.ts';
import { NumericDataMapper, NumericRecord } from './numeric.data-mapper.ts';

export type VatRateRecord = {
    value: NumericRecord;
};

export class VatRateDataMapper extends VatRate {
    static from(vatRate: VatRate): VatRateDataMapper {
        return Object.setPrototypeOf(
            vatRate,
            VatRateDataMapper.prototype
        ) as VatRateDataMapper;
    }

    static fromRecord(record: VatRateRecord): VatRateDataMapper {
        return new VatRateDataMapper(
            NumericDataMapper.fromRecord(record.value)
        );
    }

    toRecord(): VatRateRecord {
        return {
            value: NumericDataMapper.from(this._value).toRecord(),
        };
    }
}
