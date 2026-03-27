import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import type { AuthflowPolicyStorage } from '../authflow-policy-storage';
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

export type AuthflowPolicyRows = NonNullable<
    Awaited<ReturnType<AuthflowPolicyStorage['select']>>
>;

export class AuthflowPolicyDataMapper extends AuthflowPolicy {
    static from(authflowPolicy: AuthflowPolicy): AuthflowPolicyDataMapper {
        return Object.setPrototypeOf(
            authflowPolicy,
            AuthflowPolicyDataMapper.prototype
        ) as AuthflowPolicyDataMapper;
    }

    static fromRows(rows: AuthflowPolicyRows): AuthflowPolicyDataMapper {
        const {
            policy,
            templates,
            stepTemplates,
            groupTemplates,
            templateApprovers,
        } = rows;

        const record: AuthflowPolicyRecord = {
            id: { value: policy.id },
            action: { value: policy.action },
            templates: templates.map((template) => ({
                id: { value: template.id },
                range: {
                    from: {
                        amount: template.range_from_amount,
                        currency: template.range_from_currency,
                    },
                    to: {
                        amount: template.range_to_amount,
                        currency: template.range_to_currency,
                    },
                },
                steps: stepTemplates
                    .filter((s) => s.template_id === template.id)
                    .map((step) => ({
                        id: { value: step.id },
                        order: { value: step.order },
                        groups: groupTemplates
                            .filter((g) => g.step_template_id === step.id)
                            .map((group) => ({
                                id: { value: group.id },
                                requiredApprovals: group.required_approvals,
                                approvers: templateApprovers
                                    .filter(
                                        (a) => a.group_template_id === group.id
                                    )
                                    .map((approver) => ({
                                        id: { value: approver.id },
                                        name: { value: approver.name },
                                        email: { value: approver.email },
                                    })),
                            })),
                    })),
            })),
        };

        return AuthflowPolicyDataMapper.fromRecord(record);
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
