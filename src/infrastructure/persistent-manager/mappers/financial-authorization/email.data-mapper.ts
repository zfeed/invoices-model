import { Email } from '../../../../core/financial-authorization/domain/email/email';

export type EmailRecord = {
    value: string;
};

export class EmailDataMapper extends Email {
    static from(email: Email): EmailDataMapper {
        return Object.setPrototypeOf(
            email,
            EmailDataMapper.prototype
        ) as EmailDataMapper;
    }

    static fromRecord(record: EmailRecord): EmailDataMapper {
        return new EmailDataMapper(record.value);
    }

    toRecord(): EmailRecord {
        return {
            value: this._value,
        };
    }
}
