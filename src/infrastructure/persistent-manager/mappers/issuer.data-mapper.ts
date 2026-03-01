import {
    Issuer,
    ISSUER_TYPE,
} from '../../../core/invoices/domain/issuer/issuer';
import { EmailDataMapper, EmailRecord } from './email.data-mapper';

export type IssuerRecord = {
    type: ISSUER_TYPE;
    name: string;
    address: string;
    taxId: string;
    email: EmailRecord;
};

export class IssuerDataMapper extends Issuer {
    static from(issuer: Issuer): IssuerDataMapper {
        return Object.setPrototypeOf(
            issuer,
            IssuerDataMapper.prototype
        ) as IssuerDataMapper;
    }

    static fromRecord(record: IssuerRecord): IssuerDataMapper {
        return new IssuerDataMapper(
            record.type,
            record.name,
            record.address,
            record.taxId,
            EmailDataMapper.fromRecord(record.email)
        );
    }

    toRecord(): IssuerRecord {
        return {
            type: this._type,
            name: this._name,
            address: this._address,
            taxId: this._taxId,
            email: EmailDataMapper.from(this._email).toRecord(),
        };
    }
}
