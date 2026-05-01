import { Recipient, RECIPIENT_TYPE } from '../../domain/recipient/recipient.ts';
import { CountryDataMapper, CountryRecord } from './country.data-mapper.ts';
import { EmailDataMapper, EmailRecord } from './email.data-mapper.ts';
import { PaypalDataMapper, PaypalRecord } from './paypal.data-mapper.ts';

export type RecipientRecord = {
    recipient_type: RECIPIENT_TYPE;
    recipient_name: string;
    recipient_address: string;
    recipient_tax_id: string;
    recipient_email: EmailRecord['value'];
    recipient_tax_residence_country: CountryRecord['code'];
    billing: PaypalRecord;
};

export class RecipientDataMapper extends Recipient {
    static from(recipient: Recipient): RecipientDataMapper {
        return Object.setPrototypeOf(
            recipient,
            RecipientDataMapper.prototype
        ) as RecipientDataMapper;
    }

    static fromRecord(record: RecipientRecord): RecipientDataMapper {
        return new RecipientDataMapper(
            record.recipient_type,
            record.recipient_name,
            record.recipient_address,
            record.recipient_tax_id,
            EmailDataMapper.fromRecord({ value: record.recipient_email }),
            CountryDataMapper.fromRecord({
                code: record.recipient_tax_residence_country,
            }),
            PaypalDataMapper.fromRecord(record.billing)
        );
    }

    toRecord(data: { invoice_id: string }): RecipientRecord {
        return {
            recipient_type: this._type,
            recipient_name: this._name,
            recipient_address: this._address,
            recipient_tax_id: this._taxId,
            recipient_email: EmailDataMapper.from(this._email).toRecord().value,
            recipient_tax_residence_country: CountryDataMapper.from(
                this._taxResidenceCountry
            ).toRecord().code,
            billing: PaypalDataMapper.from(this._billing).toRecord(data),
        };
    }
}
