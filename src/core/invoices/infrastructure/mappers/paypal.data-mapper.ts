import { Paypal } from '../../domain/billing/paypal/paypal.ts';
import { EmailDataMapper, EmailRecord } from './email.data-mapper.ts';

export type PaypalRecord = {
    invoice_id: string;
    email: string;
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
            email: EmailDataMapper.fromRecord({
                value: record.email,
            }),
        });
    }

    toRecord(data: { invoice_id: string }): PaypalRecord {
        return {
            invoice_id: data.invoice_id,
            email: EmailDataMapper.from(this.data.email).toRecord().value,
        };
    }
}
