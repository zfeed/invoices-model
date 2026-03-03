import { sql } from 'kysely';
import { ControlledTransaction } from '../../../database/kysely';
import { FinancialDocumentRecord } from './mappers/financial-authorization/financial-document.data-mapper';

export class FinancialDocumentStorage {
    constructor(private tx: ControlledTransaction) {}

    async select(id: string) {
        const document = await this.tx
            .selectFrom('documents')
            .where('id', '=', id)
            .selectAll()
            .forUpdate()
            .executeTakeFirst();

        if (!document) return null;

        return this.selectFrom(document);
    }

    async selectByReferenceId(referenceId: string) {
        const document = await this.tx
            .selectFrom('documents')
            .where('reference_id', '=', referenceId)
            .selectAll()
            .executeTakeFirst();

        if (!document) return null;

        return this.selectFrom(document);
    }

    private async selectFrom(document: {
        id: string;
        reference_id: string;
        value_amount: string;
        value_currency: string;
    }) {
        const authflows = await this.tx
            .selectFrom('authflows')
            .where('document_id', '=', document.id)
            .selectAll()
            .execute();

        const authflowIds = authflows.map((a) => a.id);

        const steps =
            authflowIds.length > 0
                ? await this.tx
                      .selectFrom('steps')
                      .where('authflow_id', 'in', authflowIds)
                      .selectAll()
                      .execute()
                : [];

        const stepIds = steps.map((s) => s.id);

        const groups =
            stepIds.length > 0
                ? await this.tx
                      .selectFrom('groups')
                      .where('step_id', 'in', stepIds)
                      .selectAll()
                      .execute()
                : [];

        const groupIds = groups.map((g) => g.id);

        const approvers =
            groupIds.length > 0
                ? await this.tx
                      .selectFrom('approvers')
                      .where('group_id', 'in', groupIds)
                      .selectAll()
                      .execute()
                : [];

        const approvals =
            groupIds.length > 0
                ? await this.tx
                      .selectFrom('approvals')
                      .where('group_id', 'in', groupIds)
                      .selectAll()
                      .execute()
                : [];

        return { document, authflows, steps, groups, approvers, approvals };
    }

    async merge(record: FinancialDocumentRecord) {
        await this.tx
            .mergeInto('documents')
            .using(
                sql<{
                    id: string;
                }>`(SELECT ${record.id.value}::uuid AS id)`.as('source'),
                (join) => join.onRef('documents.id', '=', 'source.id')
            )
            .whenMatched()
            .thenUpdateSet({
                reference_id: record.referenceId.value,
                value_amount: record.value.amount,
                value_currency: record.value.currency,
            })
            .whenNotMatched()
            .thenInsertValues({
                id: record.id.value,
                reference_id: record.referenceId.value,
                value_amount: record.value.amount,
                value_currency: record.value.currency,
            })
            .execute();

        await this.deleteChildren(record.id.value);
        await this.insertChildren(record);
    }

    private async deleteChildren(documentId: string) {
        const authflowIds = this.tx
            .selectFrom('authflows')
            .select('id')
            .where('document_id', '=', documentId);

        const stepIds = this.tx
            .selectFrom('steps')
            .select('id')
            .where('authflow_id', 'in', authflowIds);

        const groupIds = this.tx
            .selectFrom('groups')
            .select('id')
            .where('step_id', 'in', stepIds);

        await this.tx
            .deleteFrom('approvals')
            .where('group_id', 'in', groupIds)
            .execute();

        await this.tx
            .deleteFrom('approvers')
            .where('group_id', 'in', groupIds)
            .execute();

        await this.tx
            .deleteFrom('groups')
            .where('step_id', 'in', stepIds)
            .execute();

        await this.tx
            .deleteFrom('steps')
            .where('authflow_id', 'in', authflowIds)
            .execute();

        await this.tx
            .deleteFrom('authflows')
            .where('document_id', '=', documentId)
            .execute();
    }

    private async insertChildren(record: FinancialDocumentRecord) {
        for (const authflow of record.authflows) {
            await this.tx
                .insertInto('authflows')
                .values({
                    id: authflow.id.value,
                    document_id: record.id.value,
                    action: authflow.action.value,
                    range_from_amount: authflow.range.from.amount,
                    range_from_currency: authflow.range.from.currency,
                    range_to_amount: authflow.range.to.amount,
                    range_to_currency: authflow.range.to.currency,
                })
                .execute();

            for (const step of authflow.steps) {
                await this.tx
                    .insertInto('steps')
                    .values({
                        id: step.id.value,
                        authflow_id: authflow.id.value,
                        order: step.order.value,
                    })
                    .execute();

                for (const group of step.groups) {
                    await this.tx
                        .insertInto('groups')
                        .values({
                            id: group.id.value,
                            step_id: step.id.value,
                            required_approvals: group.requiredApprovals,
                        })
                        .execute();

                    if (group.approvers.length > 0) {
                        await this.tx
                            .insertInto('approvers')
                            .values(
                                group.approvers.map((approver) => ({
                                    id: approver.id.value,
                                    group_id: group.id.value,
                                    name: approver.name.value,
                                    email: approver.email.value,
                                }))
                            )
                            .execute();
                    }

                    if (group.approvals.length > 0) {
                        await this.tx
                            .insertInto('approvals')
                            .values(
                                group.approvals.map((approval) => ({
                                    group_id: group.id.value,
                                    approver_id: approval.approverId.value,
                                    created_at: approval.createdAt.value,
                                    comment: approval.comment.value,
                                }))
                            )
                            .execute();
                    }
                }
            }
        }
    }
}
