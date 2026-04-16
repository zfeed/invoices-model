import { Paypal } from '../../domain/billing/paypal/paypal.ts';
import { EmailDataMapper, EmailRecord } from './email.data-mapper.ts';

export type PaypalRecord = {
    type: 'PAYPAL';
    data: {
        email: EmailRecord;
    };
};

export class PaypalDataMapper extends Paypal {
    static from(paypal: Paypal): PaypalDataMapper {
        return Object.setPrototypeOf(
            paypal,
            PaypalDataMapper.prototype
        ) as PaypalDataMapper;
    }

    static fromRecord(record: PaypalRecord): PaypalDataMapper {
        return new PaypalDataMapper({
            email: EmailDataMapper.fromRecord(record.data.email),
        });
    }

    toRecord(): PaypalRecord {
        return {
            type: this.type,
            data: {
                email: EmailDataMapper.from(this.data.email).toRecord(),
            },
        };
    }
}
