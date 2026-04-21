import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { AuthflowPolicy } from '../domain/authflow/authflow-policy.ts';
import {
    AuthflowPolicyDataMapper,
    AuthflowPolicyRecord,
} from './mappers/authflow-policy.data-mapper.ts';

const loadChildren = async (
    tx: ControlledTransaction,
    policy: { id: string; action: string }
) => {
    const templates = await tx
        .selectFrom('templates')
        .where('policy_id', '=', policy.id)
        .selectAll()
        .execute();

    const templateIds = templates.map((t) => t.id);

    const stepTemplates =
        templateIds.length > 0
            ? await tx
                  .selectFrom('step_templates')
                  .where('template_id', 'in', templateIds)
                  .selectAll()
                  .execute()
            : [];

    const stepTemplateIds = stepTemplates.map((s) => s.id);

    const groupTemplates =
        stepTemplateIds.length > 0
            ? await tx
                  .selectFrom('group_templates')
                  .where('step_template_id', 'in', stepTemplateIds)
                  .selectAll()
                  .execute()
            : [];

    const groupTemplateIds = groupTemplates.map((g) => g.id);

    const templateApprovers =
        groupTemplateIds.length > 0
            ? await tx
                  .selectFrom('template_approvers')
                  .where('group_template_id', 'in', groupTemplateIds)
                  .selectAll()
                  .execute()
            : [];

    return {
        policy,
        templates,
        stepTemplates,
        groupTemplates,
        templateApprovers,
    };
};

export const selectAuthflowPolicy = async (
    tx: ControlledTransaction,
    id: string
) => {
    const policy = await tx
        .selectFrom('policies')
        .where('id', '=', id)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

    if (!policy) return null;

    return loadChildren(tx, policy);
};

const selectAuthflowPolicyByAction = async (
    tx: ControlledTransaction,
    action: string
) => {
    const policy = await tx
        .selectFrom('policies')
        .where('action', '=', action)
        .orderBy('id', 'desc')
        .selectAll()
        .executeTakeFirst();

    if (!policy) return null;

    return loadChildren(tx, policy);
};

const mergeAuthflowPolicy = async (
    tx: ControlledTransaction,
    record: AuthflowPolicyRecord
) => {
    await tx
        .mergeInto('policies')
        .using(
            sql<{
                id: string;
            }>`(SELECT ${record.id.value}::uuid AS id)`.as('source'),
            (join) => join.onRef('policies.id', '=', 'source.id')
        )
        .whenMatched()
        .thenUpdateSet({
            action: record.action.value,
        })
        .whenNotMatched()
        .thenInsertValues({
            id: record.id.value,
            action: record.action.value,
        })
        .execute();

    const templateIds = tx
        .selectFrom('templates')
        .select('id')
        .where('policy_id', '=', record.id.value);

    const stepTemplateIds = tx
        .selectFrom('step_templates')
        .select('id')
        .where('template_id', 'in', templateIds);

    const groupTemplateIds = tx
        .selectFrom('group_templates')
        .select('id')
        .where('step_template_id', 'in', stepTemplateIds);

    await tx
        .deleteFrom('template_approvers')
        .where('group_template_id', 'in', groupTemplateIds)
        .execute();

    await tx
        .deleteFrom('group_templates')
        .where('step_template_id', 'in', stepTemplateIds)
        .execute();

    await tx
        .deleteFrom('step_templates')
        .where('template_id', 'in', templateIds)
        .execute();

    await tx
        .deleteFrom('templates')
        .where('policy_id', '=', record.id.value)
        .execute();

    for (const template of record.templates) {
        await tx
            .insertInto('templates')
            .values({
                id: template.id.value,
                policy_id: record.id.value,
                range_from_amount: template.range.from.amount,
                range_from_currency: template.range.from.currency,
                range_to_amount: template.range.to.amount,
                range_to_currency: template.range.to.currency,
            })
            .execute();

        for (const step of template.steps) {
            await tx
                .insertInto('step_templates')
                .values({
                    id: step.id.value,
                    template_id: template.id.value,
                    order: step.order.value,
                })
                .execute();

            for (const group of step.groups) {
                await tx
                    .insertInto('group_templates')
                    .values({
                        id: group.id.value,
                        step_template_id: step.id.value,
                        required_approvals: group.requiredApprovals,
                    })
                    .execute();

                if (group.approvers.length > 0) {
                    await tx
                        .insertInto('template_approvers')
                        .values(
                            group.approvers.map((approver) => ({
                                id: approver.id.value,
                                group_template_id: group.id.value,
                                name: approver.name.value,
                                email: approver.email.value,
                            }))
                        )
                        .execute();
                }
            }
        }
    }
};

export class AuthflowPolicyPersister implements EntityPersister<AuthflowPolicy> {
    readonly entityClass = AuthflowPolicy;

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<AuthflowPolicy | null> {
        const rows = await selectAuthflowPolicy(tx, id);

        if (!rows) {
            return null;
        }

        return AuthflowPolicyDataMapper.fromRows(rows);
    }

    async merge(
        tx: ControlledTransaction,
        entity: AuthflowPolicy
    ): Promise<void> {
        const record = AuthflowPolicyDataMapper.from(entity).toRecord();
        await mergeAuthflowPolicy(tx, record);
    }

    async findBy(
        tx: ControlledTransaction,
        key: string,
        value: string
    ): Promise<AuthflowPolicy | null> {
        if (key !== 'action') {
            throw new Error(
                `AuthflowPolicy does not support findBy key: ${key}`
            );
        }

        const rows = await selectAuthflowPolicyByAction(tx, value);

        if (!rows) {
            return null;
        }

        return AuthflowPolicyDataMapper.fromRows(rows);
    }
}
