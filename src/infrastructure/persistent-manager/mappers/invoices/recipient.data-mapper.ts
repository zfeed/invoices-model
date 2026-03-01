import {
    Recipient,
    RECIPIENT_TYPE,
} from '../../../../core/invoices/domain/recipient/recipient';
import { CountryDataMapper, CountryRecord } from './country.data-mapper';
import { EmailDataMapper, EmailRecord } from './email.data-mapper';
import { PaypalDataMapper, PaypalRecord } from './paypal.data-mapper';

export type RecipientRecord = {
    type: RECIPIENT_TYPE;
    name: string;
    address: string;
    taxId: string;
    email: EmailRecord;
    taxResidenceCountry: CountryRecord;
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
            record.type,
            record.name,
            record.address,
            record.taxId,
            EmailDataMapper.fromRecord(record.email),
            CountryDataMapper.fromRecord(record.taxResidenceCountry),
            PaypalDataMapper.fromRecord(record.billing)
        );
    }

    toRecord(): RecipientRecord {
        return {
            type: this._type,
            name: this._name,
            address: this._address,
            taxId: this._taxId,
            email: EmailDataMapper.from(this._email).toRecord(),
            taxResidenceCountry: CountryDataMapper.from(
                this._taxResidenceCountry
            ).toRecord(),
            billing: PaypalDataMapper.from(this._billing).toRecord(),
        };
    }
}
