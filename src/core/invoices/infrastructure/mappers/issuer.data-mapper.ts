import { Issuer, ISSUER_TYPE } from '../../domain/issuer/issuer.ts';
import { EmailDataMapper, EmailRecord } from './email.data-mapper.ts';

export type IssuerRecord = {
    issuer_type: ISSUER_TYPE;
    issuer_name: string;
    issuer_address: string;
    issuer_tax_id: string;
    issuer_email: EmailRecord['value'];
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
            record.issuer_type,
            record.issuer_name,
            record.issuer_address,
            record.issuer_tax_id,
            EmailDataMapper.fromRecord({
                value: record.issuer_email,
            })
        );
    }

    toRecord(): IssuerRecord {
        return {
            issuer_type: this._type,
            issuer_name: this._name,
            issuer_address: this._address,
            issuer_tax_id: this._taxId,
            issuer_email: EmailDataMapper.from(this._email).toRecord().value,
        };
    }
}
