import { Currency } from '../../../../core/invoices/domain/money/currency/currency';

export type CurrencyRecord = {
    code: string;
};

export class CurrencyDataMapper extends Currency {
    static from(currency: Currency): CurrencyDataMapper {
        return Object.setPrototypeOf(
            currency,
            CurrencyDataMapper.prototype
        ) as CurrencyDataMapper;
    }

    static fromRecord(record: CurrencyRecord): CurrencyDataMapper {
        return new CurrencyDataMapper(record.code);
    }

    toRecord(): CurrencyRecord {
        return {
            code: this._code,
        };
    }
}
