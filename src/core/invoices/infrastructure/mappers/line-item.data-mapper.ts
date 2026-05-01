import { LineItem } from '../../domain/line-item/line-item.ts';
import { IdDataMapper, IdRecord } from './id.data-mapper.ts';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper.ts';
import {
    UnitDescriptionDataMapper,
    UnitDescriptionRecord,
} from './unit-description.data-mapper.ts';
import {
    UnitQuantityDataMapper,
    UnitQuantityRecord,
} from './unit-quantity.data-mapper.ts';

export type LineItemRecord = {
    id: IdRecord['value'];
    invoice_id: IdRecord['value'];
    description: UnitDescriptionRecord['value'];
    price_amount: MoneyRecord['amount']['value'];
    price_currency: MoneyRecord['currency']['code'];
    quantity: UnitQuantityRecord['value']['value'];
    total_amount: MoneyRecord['amount']['value'];
    total_currency: MoneyRecord['currency']['code'];
};

export class LineItemDataMapper extends LineItem {
    static from(lineItem: LineItem): LineItemDataMapper {
        return Object.setPrototypeOf(
            lineItem,
            LineItemDataMapper.prototype
        ) as LineItemDataMapper;
    }

    static fromRecord(record: LineItemRecord): LineItemDataMapper {
        return new LineItemDataMapper(
            IdDataMapper.fromRecord({ value: record.id }),
            UnitDescriptionDataMapper.fromRecord({ value: record.description }),
            MoneyDataMapper.fromRecord({
                amount: { value: record.price_amount },
                currency: {
                    code: record.price_currency,
                },
            }),
            UnitQuantityDataMapper.fromRecord({
                value: {
                    value: record.quantity,
                },
            }),
            MoneyDataMapper.fromRecord({
                amount: { value: record.total_amount },
                currency: {
                    code: record.total_currency,
                },
            })
        );
    }

    toRecord(data: { invoice_id: string }): LineItemRecord {
        const priceRecord = MoneyDataMapper.from(this._price).toRecord();
        const totalRecord = MoneyDataMapper.from(this._total).toRecord();

        return {
            id: IdDataMapper.from(this._id).toRecord().value,
            invoice_id: data.invoice_id,
            description: UnitDescriptionDataMapper.from(
                this._description
            ).toRecord().value,
            price_amount: priceRecord.amount.value,
            price_currency: priceRecord.currency.code,
            quantity: UnitQuantityDataMapper.from(this._quantity).toRecord()
                .value.value,
            total_amount: totalRecord.amount.value,
            total_currency: totalRecord.currency.code,
        };
    }
}
