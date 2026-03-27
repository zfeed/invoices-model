import { Order } from '../../domain/order/order';

export type OrderRecord = {
    value: number;
};

export class OrderDataMapper extends Order {
    static from(order: Order): OrderDataMapper {
        return Object.setPrototypeOf(
            order,
            OrderDataMapper.prototype
        ) as OrderDataMapper;
    }

    static fromRecord(record: OrderRecord): OrderDataMapper {
        return new OrderDataMapper(record.value);
    }

    toRecord(): OrderRecord {
        return {
            value: this._value,
        };
    }
}
