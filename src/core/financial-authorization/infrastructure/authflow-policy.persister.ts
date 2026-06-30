import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { AuthflowPolicy } from '../domain/authflow/authflow-policy.ts';
import {
    AuthflowPolicyDataMapper,
    AuthflowPolicyRecord,
} from './mappers/authflow-policy.data-mapper.ts';
import { organizationContext } from '../../../lib/organization-context/organization-context.ts';

const loadChildren = async (
    tx: ControlledTransaction,
    policy: { id: string; action: string },
    organizationId: string
) => {
    const templates = await tx
        .selectFrom('templates')
        .where('policy_id', '=', policy.id)
        .where('organization_id', '=', organizationId)
        .selectAll()
        .execute();

    const templateIds = templates.map((t) => t.id);

    const stepTemplates =
        templateIds.length > 0
            ? await tx
                  .selectFrom('step_templates')
                  .where('template_id', 'in', templateIds)
                  .where('organization_id', '=', organizationId)
                  .selectAll()
                  .execute()
            : [];

    const stepTemplateIds = stepTemplates.map((s) => s.id);

    const groupTemplates =
        stepTemplateIds.length > 0
            ? await tx
                  .selectFrom('group_templates')
                  .where('step_template_id', 'in', stepTemplateIds)
                  .where('organization_id', '=', organizationId)
                  .selectAll()
                  .execute()
            : [];

    const groupTemplateIds = groupTemplates.map((g) => g.id);

    const templateApprovers =
        groupTemplateIds.length > 0
            ? await tx
                  .selectFrom('template_approvers')
                  .where('group_template_id', 'in', groupTemplateIds)
                  .where('organization_id', '=', organizationId)
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
    id: string,
    organizationId: string
) => {
    const policy = await tx
        .selectFrom('policies')
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

    if (!policy) return null;

    return loadChildren(tx, policy, organizationId);
};

const selectAuthflowPolicyByAction = async (
    tx: ControlledTransaction,
    action: string,
    organizationId: string
) => {
    const policy = await tx
        .selectFrom('policies')
        .where('action', '=', action)
        .where('organization_id', '=', organizationId)
        .orderBy('id', 'desc')
        .selectAll()
        .executeTakeFirst();

    if (!policy) return null;

    return loadChildren(tx, policy, organizationId);
};

const insertChildren = async (
    tx: ControlledTransaction,
    record: AuthflowPolicyRecord,
    organizationId: string
) => {
    for (const template of record.templates) {
        await tx
            .insertInto('templates')
            .values({
                id: template.id.value,
                policy_id: record.id.value,
                organization_id: organizationId,
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
                    organization_id: organizationId,
                    order: step.order.value,
                })
                .execute();

            for (const group of step.groups) {
                await tx
                    .insertInto('group_templates')
                    .values({
                        id: group.id.value,
                        step_template_id: step.id.value,
                        organization_id: organizationId,
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
                                organization_id: organizationId,
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

const deleteChildren = async (
    tx: ControlledTransaction,
    policyId: string,
    organizationId: string
) => {
    const templateIds = tx
        .selectFrom('templates')
        .select('id')
        .where('policy_id', '=', policyId)
        .where('organization_id', '=', organizationId);

    const stepTemplateIds = tx
        .selectFrom('step_templates')
        .select('id')
        .where('template_id', 'in', templateIds)
        .where('organization_id', '=', organizationId);

    const groupTemplateIds = tx
        .selectFrom('group_templates')
        .select('id')
        .where('step_template_id', 'in', stepTemplateIds)
        .where('organization_id', '=', organizationId);

    await tx
        .deleteFrom('template_approvers')
        .where('group_template_id', 'in', groupTemplateIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('group_templates')
        .where('step_template_id', 'in', stepTemplateIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('step_templates')
        .where('template_id', 'in', templateIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('templates')
        .where('policy_id', '=', policyId)
        .where('organization_id', '=', organizationId)
        .execute();
};

const createAuthflowPolicy = async (
    tx: ControlledTransaction,
    record: AuthflowPolicyRecord,
    organizationId: string
) => {
    await tx
        .insertInto('policies')
        .values({
            id: record.id.value,
            organization_id: organizationId,
            action: record.action.value,
        })
        .execute();

    await insertChildren(tx, record, organizationId);
};

const mergeAuthflowPolicy = async (
    tx: ControlledTransaction,
    record: AuthflowPolicyRecord,
    organizationId: string
) => {
    await tx
        .mergeInto('policies')
        .using(
            sql<{
                id: string;
            }>`(SELECT ${record.id.value}::uuid AS id)`.as('source'),
            (join) =>
                join
                    .onRef('policies.id', '=', 'source.id')
                    .on('policies.organization_id', '=', organizationId)
        )
        .whenMatched()
        .thenUpdateSet({
            action: record.action.value,
        })
        .whenNotMatched()
        .thenInsertValues({
            id: record.id.value,
            organization_id: organizationId,
            action: record.action.value,
        })
        .execute();

    await deleteChildren(tx, record.id.value, organizationId);
    await insertChildren(tx, record, organizationId);
};

export class AuthflowPolicyPersister implements EntityPersister<AuthflowPolicy> {
    readonly entityClass = AuthflowPolicy;

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<AuthflowPolicy | null> {
        const organizationId = organizationContext.getOrganizationId();
        const rows = await selectAuthflowPolicy(tx, id, organizationId);

        if (!rows) {
            return null;
        }

        return AuthflowPolicyDataMapper.fromRows(rows);
    }

    async create(
        tx: ControlledTransaction,
        entity: AuthflowPolicy
    ): Promise<void> {
        const organizationId = organizationContext.getOrganizationId();
        const record = AuthflowPolicyDataMapper.from(entity).toRecord();
        await createAuthflowPolicy(tx, record, organizationId);
    }

    async merge(
        tx: ControlledTransaction,
        entity: AuthflowPolicy
    ): Promise<void> {
        const organizationId = organizationContext.getOrganizationId();
        const record = AuthflowPolicyDataMapper.from(entity).toRecord();
        await mergeAuthflowPolicy(tx, record, organizationId);
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

        const organizationId = organizationContext.getOrganizationId();
        const rows = await selectAuthflowPolicyByAction(
            tx,
            value,
            organizationId
        );

        if (!rows) {
            return null;
        }

        return AuthflowPolicyDataMapper.fromRows(rows);
    }
}
