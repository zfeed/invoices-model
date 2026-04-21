import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { FinancialDocument } from '../domain/document/document.ts';
import {
    FinancialDocumentDataMapper,
    FinancialDocumentRecord,
} from './mappers/financial-document.data-mapper.ts';

const loadChildren = async (
    tx: ControlledTransaction,
    document: {
        id: string;
        reference_id: string;
        value_amount: string;
        value_currency: string;
    }
) => {
    const authflows = await tx
        .selectFrom('authflows')
        .where('document_id', '=', document.id)
        .selectAll()
        .execute();

    const authflowIds = authflows.map((a) => a.id);

    const steps =
        authflowIds.length > 0
            ? await tx
                  .selectFrom('steps')
                  .where('authflow_id', 'in', authflowIds)
                  .selectAll()
                  .execute()
            : [];

    const stepIds = steps.map((s) => s.id);

    const groups =
        stepIds.length > 0
            ? await tx
                  .selectFrom('groups')
                  .where('step_id', 'in', stepIds)
                  .selectAll()
                  .execute()
            : [];

    const groupIds = groups.map((g) => g.id);

    const approvers =
        groupIds.length > 0
            ? await tx
                  .selectFrom('approvers')
                  .where('group_id', 'in', groupIds)
                  .selectAll()
                  .execute()
            : [];

    const approvals =
        groupIds.length > 0
            ? await tx
                  .selectFrom('approvals')
                  .where('group_id', 'in', groupIds)
                  .selectAll()
                  .execute()
            : [];

    return { document, authflows, steps, groups, approvers, approvals };
};

export const selectFinancialDocument = async (
    tx: ControlledTransaction,
    id: string
) => {
    const document = await tx
        .selectFrom('documents')
        .where('id', '=', id)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

    if (!document) return null;

    return loadChildren(tx, document);
};

const selectFinancialDocumentByReferenceId = async (
    tx: ControlledTransaction,
    referenceId: string
) => {
    const document = await tx
        .selectFrom('documents')
        .where('reference_id', '=', referenceId)
        .selectAll()
        .executeTakeFirst();

    if (!document) return null;

    return loadChildren(tx, document);
};

const mergeFinancialDocument = async (
    tx: ControlledTransaction,
    record: FinancialDocumentRecord
) => {
    await tx
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

    const authflowIds = tx
        .selectFrom('authflows')
        .select('id')
        .where('document_id', '=', record.id.value);

    const stepIds = tx
        .selectFrom('steps')
        .select('id')
        .where('authflow_id', 'in', authflowIds);

    const groupIds = tx
        .selectFrom('groups')
        .select('id')
        .where('step_id', 'in', stepIds);

    await tx
        .deleteFrom('approvals')
        .where('group_id', 'in', groupIds)
        .execute();

    await tx
        .deleteFrom('approvers')
        .where('group_id', 'in', groupIds)
        .execute();

    await tx.deleteFrom('groups').where('step_id', 'in', stepIds).execute();

    await tx
        .deleteFrom('steps')
        .where('authflow_id', 'in', authflowIds)
        .execute();

    await tx
        .deleteFrom('authflows')
        .where('document_id', '=', record.id.value)
        .execute();

    for (const authflow of record.authflows) {
        await tx
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
            await tx
                .insertInto('steps')
                .values({
                    id: step.id.value,
                    authflow_id: authflow.id.value,
                    order: step.order.value,
                })
                .execute();

            for (const group of step.groups) {
                await tx
                    .insertInto('groups')
                    .values({
                        id: group.id.value,
                        step_id: step.id.value,
                        required_approvals: group.requiredApprovals,
                    })
                    .execute();

                if (group.approvers.length > 0) {
                    await tx
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
                    await tx
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
};

export const financialDocumentPersister: EntityPersister<FinancialDocument> = {
    entityClass: FinancialDocument,

    async select(tx, id) {
        const rows = await selectFinancialDocument(tx, id);

        if (!rows) {
            return null;
        }

        return FinancialDocumentDataMapper.fromRows(rows);
    },

    async merge(tx, entity) {
        const record = FinancialDocumentDataMapper.from(entity).toRecord();
        await mergeFinancialDocument(tx, record);
    },

    async findBy(tx, key, value) {
        if (key !== 'referenceId') {
            throw new Error(
                `FinancialDocument does not support findBy key: ${key}`
            );
        }

        const rows = await selectFinancialDocumentByReferenceId(tx, value);

        if (!rows) {
            return null;
        }

        return FinancialDocumentDataMapper.fromRows(rows);
    },
};
