import { LineItem } from '../../../core/invoices/domain/line-item/line-item';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper';
import {
    UnitDescriptionDataMapper,
    UnitDescriptionRecord,
} from './unit-description.data-mapper';
import {
    UnitQuantityDataMapper,
    UnitQuantityRecord,
} from './unit-quantity.data-mapper';

export type LineItemRecord = {
    description: UnitDescriptionRecord;
    price: MoneyRecord;
    quantity: UnitQuantityRecord;
    total: MoneyRecord;
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
            UnitDescriptionDataMapper.fromRecord(record.description),
            MoneyDataMapper.fromRecord(record.price),
            UnitQuantityDataMapper.fromRecord(record.quantity),
            MoneyDataMapper.fromRecord(record.total)
        );
    }

    toRecord(): LineItemRecord {
        return {
            description: UnitDescriptionDataMapper.from(
                this._description
            ).toRecord(),
            price: MoneyDataMapper.from(this._price).toRecord(),
            quantity: UnitQuantityDataMapper.from(this._quantity).toRecord(),
            total: MoneyDataMapper.from(this._total).toRecord(),
        };
    }
}
