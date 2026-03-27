import { Money } from '../../domain/money/money/money';
import { CurrencyDataMapper, CurrencyRecord } from './currency.data-mapper';
import { NumericDataMapper, NumericRecord } from './numeric.data-mapper';

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
