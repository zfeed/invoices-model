import { Step } from '../../domain/step/step';
import { GroupDataMapper, GroupRecord } from './group.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { OrderDataMapper, OrderRecord } from './order.data-mapper';

export type StepRecord = {
    id: IdRecord;
    order: OrderRecord;
    isApproved: boolean;
    groups: GroupRecord[];
};

export class StepDataMapper extends Step {
    static from(step: Step): StepDataMapper {
        return Object.setPrototypeOf(
            step,
            StepDataMapper.prototype
        ) as StepDataMapper;
    }

    static fromRecord(record: StepRecord): StepDataMapper {
        const groups = record.groups.map((g) => GroupDataMapper.fromRecord(g));
        return new StepDataMapper(
            IdDataMapper.fromRecord(record.id),
            OrderDataMapper.fromRecord(record.order),
            groups.every((g) => g.isApproved),
            groups
        );
    }

    toRecord(): StepRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            order: OrderDataMapper.from(this._order).toRecord(),
            isApproved: this._isApproved,
            groups: this._groups.map((g) => GroupDataMapper.from(g).toRecord()),
        };
    }
}
