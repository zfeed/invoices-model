import { GroupTemplate } from '../../../../core/financial-authorization/domain/groups/group-template';
import { ApproverDataMapper, ApproverRecord } from './approver.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';

export type GroupTemplateRecord = {
    id: IdRecord;
    requiredApprovals: number;
    approvers: ApproverRecord[];
};

export class GroupTemplateDataMapper extends GroupTemplate {
    static from(groupTemplate: GroupTemplate): GroupTemplateDataMapper {
        return Object.setPrototypeOf(
            groupTemplate,
            GroupTemplateDataMapper.prototype
        ) as GroupTemplateDataMapper;
    }

    static fromRecord(record: GroupTemplateRecord): GroupTemplateDataMapper {
        return new GroupTemplateDataMapper(
            IdDataMapper.fromRecord(record.id),
            record.requiredApprovals,
            record.approvers.map((a) => ApproverDataMapper.fromRecord(a))
        );
    }

    toRecord(): GroupTemplateRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            requiredApprovals: this._requiredApprovals,
            approvers: this._approvers.map((a) =>
                ApproverDataMapper.from(a).toRecord()
            ),
        };
    }
}
