import { LineItems } from '../../../core/invoices/domain/line-items/line-items';
import { LineItemDataMapper, LineItemRecord } from './line-item.data-mapper';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper';

export type LineItemsRecord = {
    items: LineItemRecord[];
    subtotal: MoneyRecord;
};

export class LineItemsDataMapper extends LineItems {
    static from(lineItems: LineItems): LineItemsDataMapper {
        return Object.setPrototypeOf(
            lineItems,
            LineItemsDataMapper.prototype
        ) as LineItemsDataMapper;
    }

    static fromRecord(record: LineItemsRecord): LineItemsDataMapper {
        return new LineItemsDataMapper(
            record.items.map((item) => LineItemDataMapper.fromRecord(item)),
            MoneyDataMapper.fromRecord(record.subtotal)
        );
    }

    toRecord(): LineItemsRecord {
        return {
            items: this._items.map((item) =>
                LineItemDataMapper.from(item).toRecord()
            ),
            subtotal: MoneyDataMapper.from(this._subtotal).toRecord(),
        };
    }
}
