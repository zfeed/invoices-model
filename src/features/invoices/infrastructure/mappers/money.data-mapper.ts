import { Money } from '../../domain/money/money/money.ts';
import { CurrencyDataMapper, CurrencyRecord } from './currency.data-mapper.ts';
import { NumericDataMapper, NumericRecord } from './numeric.data-mapper.ts';

export type MoneyRecord = {
    amount: NumericRecord;
    currency: CurrencyRecord;
};

export class MoneyDataMapper extends Money {
    static from(money: Money): MoneyDataMapper {
        return Object.setPrototypeOf(
            money,
            MoneyDataMapper.prototype
        ) as MoneyDataMapper;
    }

    static fromRecord(record: MoneyRecord): MoneyDataMapper {
        return new MoneyDataMapper(
            NumericDataMapper.fromRecord(record.amount),
            CurrencyDataMapper.fromRecord(record.currency)
        );
    }

    toRecord(): MoneyRecord {
        return {
            amount: NumericDataMapper.from(this._amount).toRecord(),
            currency: CurrencyDataMapper.from(this._currency).toRecord(),
        };
    }
}
