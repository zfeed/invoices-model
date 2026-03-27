import { Group } from '../../domain/groups/group';
import { ApprovalDataMapper, ApprovalRecord } from './approval.data-mapper';
import { ApproverDataMapper, ApproverRecord } from './approver.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';

export type GroupRecord = {
    id: IdRecord;
    requiredApprovals: number;
    approvers: ApproverRecord[];
    approvals: ApprovalRecord[];
};

export class GroupDataMapper extends Group {
    static from(group: Group): GroupDataMapper {
        return Object.setPrototypeOf(
            group,
            GroupDataMapper.prototype
        ) as GroupDataMapper;
    }

    static fromRecord(record: GroupRecord): GroupDataMapper {
        return new GroupDataMapper(
            IdDataMapper.fromRecord(record.id),
            record.requiredApprovals,
            record.approvers.map((a) => ApproverDataMapper.fromRecord(a)),
            record.approvals.map((a) => ApprovalDataMapper.fromRecord(a))
        );
    }

    toRecord(): GroupRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            requiredApprovals: this._requiredApprovals,
            approvers: this._approvers.map((a) =>
                ApproverDataMapper.from(a).toRecord()
            ),
            approvals: this._approvals.map((a) =>
                ApprovalDataMapper.from(a).toRecord()
            ),
        };
    }
}
