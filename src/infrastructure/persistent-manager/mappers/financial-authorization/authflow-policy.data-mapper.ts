import { AuthflowPolicy } from '../../../../core/financial-authorization/domain/authflow/authflow-policy';
import { ActionDataMapper, ActionRecord } from './action.data-mapper';
import {
    AuthflowTemplateDataMapper,
    AuthflowTemplateRecord,
} from './authflow-template.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';

export type AuthflowPolicyRecord = {
    id: IdRecord;
    action: ActionRecord;
    templates: AuthflowTemplateRecord[];
};

export class AuthflowPolicyDataMapper extends AuthflowPolicy {
    static from(authflowPolicy: AuthflowPolicy): AuthflowPolicyDataMapper {
        return Object.setPrototypeOf(
            authflowPolicy,
            AuthflowPolicyDataMapper.prototype
        ) as AuthflowPolicyDataMapper;
    }

    static fromRecord(record: AuthflowPolicyRecord): AuthflowPolicyDataMapper {
        return new AuthflowPolicyDataMapper(
            IdDataMapper.fromRecord(record.id),
            ActionDataMapper.fromRecord(record.action),
            record.templates.map((t) =>
                AuthflowTemplateDataMapper.fromRecord(t)
            )
        );
    }

    toRecord(): AuthflowPolicyRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            action: ActionDataMapper.from(this._action).toRecord(),
            templates: this._templates.map((t) =>
                AuthflowTemplateDataMapper.from(t).toRecord()
            ),
        };
    }
}
