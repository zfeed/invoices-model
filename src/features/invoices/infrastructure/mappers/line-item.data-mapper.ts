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
    id: IdRecord;
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
            IdDataMapper.fromRecord(record.id),
            UnitDescriptionDataMapper.fromRecord(record.description),
            MoneyDataMapper.fromRecord(record.price),
            UnitQuantityDataMapper.fromRecord(record.quantity),
            MoneyDataMapper.fromRecord(record.total)
        );
    }

    toRecord(): LineItemRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            description: UnitDescriptionDataMapper.from(
                this._description
            ).toRecord(),
            price: MoneyDataMapper.from(this._price).toRecord(),
            quantity: UnitQuantityDataMapper.from(this._quantity).toRecord(),
            total: MoneyDataMapper.from(this._total).toRecord(),
        };
    }
}
