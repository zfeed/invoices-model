import { Authflow } from '../../domain/authflow/authflow';
import { ActionDataMapper, ActionRecord } from './action.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { RangeDataMapper, RangeRecord } from './range.data-mapper';
import { StepDataMapper, StepRecord } from './step.data-mapper';

export type AuthflowRecord = {
    id: IdRecord;
    action: ActionRecord;
    range: RangeRecord;
    steps: StepRecord[];
};

export class AuthflowDataMapper extends Authflow {
    static from(authflow: Authflow): AuthflowDataMapper {
        return Object.setPrototypeOf(
            authflow,
            AuthflowDataMapper.prototype
        ) as AuthflowDataMapper;
    }

    static fromRecord(record: AuthflowRecord): AuthflowDataMapper {
        return new AuthflowDataMapper(
            IdDataMapper.fromRecord(record.id),
            ActionDataMapper.fromRecord(record.action),
            RangeDataMapper.fromRecord(record.range),
            record.steps.map((s) => StepDataMapper.fromRecord(s))
        );
    }

    toRecord(): AuthflowRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            action: ActionDataMapper.from(this._action).toRecord(),
            range: RangeDataMapper.from(this._range).toRecord(),
            steps: this._steps.map((s) => StepDataMapper.from(s).toRecord()),
        };
    }
}
