import { sql } from 'kysely';
import { ControlledTransaction } from '../../../../database/kysely';
import { AuthflowPolicyRecord } from './mappers/authflow-policy.data-mapper';

export class AuthflowPolicyStorage {
    constructor(private tx: ControlledTransaction) {}

    async select(id: string) {
        const policy = await this.tx
            .selectFrom('policies')
            .where('id', '=', id)
            .selectAll()
            .forUpdate()
            .executeTakeFirst();

        if (!policy) return null;

        return this.selectFrom(policy);
    }

    async selectByAction(action: string) {
        const policy = await this.tx
            .selectFrom('policies')
            .where('action', '=', action)
            .orderBy('id', 'desc')
            .selectAll()
            .executeTakeFirst();

        if (!policy) return null;

        return this.selectFrom(policy);
    }

    private async selectFrom(policy: { id: string; action: string }) {
        const templates = await this.tx
            .selectFrom('templates')
            .where('policy_id', '=', policy.id)
            .selectAll()
            .execute();

        const templateIds = templates.map((t) => t.id);

        const stepTemplates =
            templateIds.length > 0
                ? await this.tx
                      .selectFrom('step_templates')
                      .where('template_id', 'in', templateIds)
                      .selectAll()
                      .execute()
                : [];

        const stepTemplateIds = stepTemplates.map((s) => s.id);

        const groupTemplates =
            stepTemplateIds.length > 0
                ? await this.tx
                      .selectFrom('group_templates')
                      .where('step_template_id', 'in', stepTemplateIds)
                      .selectAll()
                      .execute()
                : [];

        const groupTemplateIds = groupTemplates.map((g) => g.id);

        const templateApprovers =
            groupTemplateIds.length > 0
                ? await this.tx
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
    }

    async merge(record: AuthflowPolicyRecord) {
        await this.tx
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

        await this.deleteChildren(record.id.value);
        await this.insertChildren(record);
    }

    private async deleteChildren(policyId: string) {
        const templateIds = this.tx
            .selectFrom('templates')
            .select('id')
            .where('policy_id', '=', policyId);

        const stepTemplateIds = this.tx
            .selectFrom('step_templates')
            .select('id')
            .where('template_id', 'in', templateIds);

        const groupTemplateIds = this.tx
            .selectFrom('group_templates')
            .select('id')
            .where('step_template_id', 'in', stepTemplateIds);

        await this.tx
            .deleteFrom('template_approvers')
            .where('group_template_id', 'in', groupTemplateIds)
            .execute();

        await this.tx
            .deleteFrom('group_templates')
            .where('step_template_id', 'in', stepTemplateIds)
            .execute();

        await this.tx
            .deleteFrom('step_templates')
            .where('template_id', 'in', templateIds)
            .execute();

        await this.tx
            .deleteFrom('templates')
            .where('policy_id', '=', policyId)
            .execute();
    }

    private async insertChildren(record: AuthflowPolicyRecord) {
        for (const template of record.templates) {
            await this.tx
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
                await this.tx
                    .insertInto('step_templates')
                    .values({
                        id: step.id.value,
                        template_id: template.id.value,
                        order: step.order.value,
                    })
                    .execute();

                for (const group of step.groups) {
                    await this.tx
                        .insertInto('group_templates')
                        .values({
                            id: group.id.value,
                            step_template_id: step.id.value,
                            required_approvals: group.requiredApprovals,
                        })
                        .execute();

                    if (group.approvers.length > 0) {
                        await this.tx
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
    }
}
