import { Action } from '../../domain/action/action.ts';

export type ActionRecord = {
    value: string;
};

export class ActionDataMapper extends Action {
    static from(action: Action): ActionDataMapper {
        return Object.setPrototypeOf(
            action,
            ActionDataMapper.prototype
        ) as ActionDataMapper;
    }

    static fromRecord(record: ActionRecord): ActionDataMapper {
        return new ActionDataMapper(record.value);
    }

    toRecord(): ActionRecord {
        return {
            value: this._value,
        };
    }
}
