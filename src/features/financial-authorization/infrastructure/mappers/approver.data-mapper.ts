import { Approver } from '../../domain/approver/approver';
import { EmailDataMapper, EmailRecord } from './email.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { NameDataMapper, NameRecord } from './name.data-mapper';

export type ApproverRecord = {
    id: IdRecord;
    name: NameRecord;
    email: EmailRecord;
};

export class ApproverDataMapper extends Approver {
    static from(approver: Approver): ApproverDataMapper {
        return Object.setPrototypeOf(
            approver,
            ApproverDataMapper.prototype
        ) as ApproverDataMapper;
    }

    static fromRecord(record: ApproverRecord): ApproverDataMapper {
        return new ApproverDataMapper(
            IdDataMapper.fromRecord(record.id),
            NameDataMapper.fromRecord(record.name),
            EmailDataMapper.fromRecord(record.email)
        );
    }

    toRecord(): ApproverRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            name: NameDataMapper.from(this._name).toRecord(),
            email: EmailDataMapper.from(this._email).toRecord(),
        };
    }
}
