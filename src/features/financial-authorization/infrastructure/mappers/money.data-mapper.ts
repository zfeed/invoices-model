import { Money } from '../../domain/money/money';

export type MoneyRecord = {
    amount: string;
    currency: string;
};

export class MoneyDataMapper extends Money {
    static from(money: Money): MoneyDataMapper {
        return Object.setPrototypeOf(
            money,
            MoneyDataMapper.prototype
        ) as MoneyDataMapper;
    }

    static fromRecord(record: MoneyRecord): MoneyDataMapper {
        return new MoneyDataMapper(record.amount, record.currency);
    }

    toRecord(): MoneyRecord {
        return {
            amount: this._amount,
            currency: this._currency,
        };
    }
}
