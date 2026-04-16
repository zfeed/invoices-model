import { GroupTemplate } from '../../domain/groups/group-template.ts';
import { ApproverDataMapper, ApproverRecord } from './approver.data-mapper.ts';
import { IdDataMapper, IdRecord } from './id.data-mapper.ts';

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
