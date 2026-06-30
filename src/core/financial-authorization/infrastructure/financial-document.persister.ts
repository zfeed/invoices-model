import { sql } from 'kysely';
import type { ControlledTransaction } from '../../../../database/kysely.ts';
import type { EntityPersister } from '../../../platform/infrastructure/persistent-manager/entity-persister.ts';
import { FinancialDocument } from '../domain/document/document.ts';
import {
    FinancialDocumentDataMapper,
    FinancialDocumentRecord,
} from './mappers/financial-document.data-mapper.ts';
import { organizationContext } from '../../../lib/organization-context/organization-context.ts';

const loadChildren = async (
    tx: ControlledTransaction,
    document: {
        id: string;
        reference_id: string;
        value_amount: string;
        value_currency: string;
    },
    organizationId: string
) => {
    const authflows = await tx
        .selectFrom('authflows')
        .where('document_id', '=', document.id)
        .where('organization_id', '=', organizationId)
        .selectAll()
        .execute();

    const authflowIds = authflows.map((a) => a.id);

    const steps =
        authflowIds.length > 0
            ? await tx
                  .selectFrom('steps')
                  .where('authflow_id', 'in', authflowIds)
                  .where('organization_id', '=', organizationId)
                  .selectAll()
                  .execute()
            : [];

    const stepIds = steps.map((s) => s.id);

    const groups =
        stepIds.length > 0
            ? await tx
                  .selectFrom('groups')
                  .where('step_id', 'in', stepIds)
                  .where('organization_id', '=', organizationId)
                  .selectAll()
                  .execute()
            : [];

    const groupIds = groups.map((g) => g.id);

    const approvers =
        groupIds.length > 0
            ? await tx
                  .selectFrom('approvers')
                  .where('group_id', 'in', groupIds)
                  .where('organization_id', '=', organizationId)
                  .selectAll()
                  .execute()
            : [];

    const approvals =
        groupIds.length > 0
            ? await tx
                  .selectFrom('approvals')
                  .where('group_id', 'in', groupIds)
                  .where('organization_id', '=', organizationId)
                  .selectAll()
                  .execute()
            : [];

    return { document, authflows, steps, groups, approvers, approvals };
};

export const selectFinancialDocument = async (
    tx: ControlledTransaction,
    id: string,
    organizationId: string
) => {
    const document = await tx
        .selectFrom('documents')
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

    if (!document) return null;

    return loadChildren(tx, document, organizationId);
};

const selectFinancialDocumentByReferenceId = async (
    tx: ControlledTransaction,
    referenceId: string,
    organizationId: string
) => {
    const document = await tx
        .selectFrom('documents')
        .where('reference_id', '=', referenceId)
        .where('organization_id', '=', organizationId)
        .selectAll()
        .executeTakeFirst();

    if (!document) return null;

    return loadChildren(tx, document, organizationId);
};

const insertChildren = async (
    tx: ControlledTransaction,
    record: FinancialDocumentRecord,
    organizationId: string
) => {
    for (const authflow of record.authflows) {
        await tx
            .insertInto('authflows')
            .values({
                id: authflow.id.value,
                document_id: record.id.value,
                organization_id: organizationId,
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
                    organization_id: organizationId,
                    order: step.order.value,
                })
                .execute();

            for (const group of step.groups) {
                await tx
                    .insertInto('groups')
                    .values({
                        id: group.id.value,
                        step_id: step.id.value,
                        organization_id: organizationId,
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
                                organization_id: organizationId,
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
                                organization_id: organizationId,
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

const deleteChildren = async (
    tx: ControlledTransaction,
    documentId: string,
    organizationId: string
) => {
    const authflowIds = tx
        .selectFrom('authflows')
        .select('id')
        .where('document_id', '=', documentId)
        .where('organization_id', '=', organizationId);

    const stepIds = tx
        .selectFrom('steps')
        .select('id')
        .where('authflow_id', 'in', authflowIds)
        .where('organization_id', '=', organizationId);

    const groupIds = tx
        .selectFrom('groups')
        .select('id')
        .where('step_id', 'in', stepIds)
        .where('organization_id', '=', organizationId);

    await tx
        .deleteFrom('approvals')
        .where('group_id', 'in', groupIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('approvers')
        .where('group_id', 'in', groupIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('groups')
        .where('step_id', 'in', stepIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('steps')
        .where('authflow_id', 'in', authflowIds)
        .where('organization_id', '=', organizationId)
        .execute();

    await tx
        .deleteFrom('authflows')
        .where('document_id', '=', documentId)
        .where('organization_id', '=', organizationId)
        .execute();
};

const createFinancialDocument = async (
    tx: ControlledTransaction,
    record: FinancialDocumentRecord,
    organizationId: string
) => {
    await tx
        .insertInto('documents')
        .values({
            id: record.id.value,
            organization_id: organizationId,
            reference_id: record.referenceId.value,
            value_amount: record.value.amount,
            value_currency: record.value.currency,
        })
        .execute();

    await insertChildren(tx, record, organizationId);
};

const mergeFinancialDocument = async (
    tx: ControlledTransaction,
    record: FinancialDocumentRecord,
    organizationId: string
) => {
    await tx
        .mergeInto('documents')
        .using(
            sql<{
                id: string;
            }>`(SELECT ${record.id.value}::uuid AS id)`.as('source'),
            (join) =>
                join
                    .onRef('documents.id', '=', 'source.id')
                    .on('documents.organization_id', '=', organizationId)
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
            organization_id: organizationId,
            reference_id: record.referenceId.value,
            value_amount: record.value.amount,
            value_currency: record.value.currency,
        })
        .execute();

    await deleteChildren(tx, record.id.value, organizationId);
    await insertChildren(tx, record, organizationId);
};

export class FinancialDocumentPersister implements EntityPersister<FinancialDocument> {
    readonly entityClass = FinancialDocument;

    async select(
        tx: ControlledTransaction,
        id: string
    ): Promise<FinancialDocument | null> {
        const organizationId = organizationContext.getOrganizationId();
        const rows = await selectFinancialDocument(tx, id, organizationId);

        if (!rows) {
            return null;
        }

        return FinancialDocumentDataMapper.fromRows(rows);
    }

    async create(
        tx: ControlledTransaction,
        entity: FinancialDocument
    ): Promise<void> {
        const organizationId = organizationContext.getOrganizationId();
        const record = FinancialDocumentDataMapper.from(entity).toRecord();
        await createFinancialDocument(tx, record, organizationId);
    }

    async merge(
        tx: ControlledTransaction,
        entity: FinancialDocument
    ): Promise<void> {
        const organizationId = organizationContext.getOrganizationId();
        const record = FinancialDocumentDataMapper.from(entity).toRecord();
        await mergeFinancialDocument(tx, record, organizationId);
    }

    async findBy(
        tx: ControlledTransaction,
        key: string,
        value: string
    ): Promise<FinancialDocument | null> {
        if (key !== 'referenceId') {
            throw new Error(
                `FinancialDocument does not support findBy key: ${key}`
            );
        }

        const organizationId = organizationContext.getOrganizationId();
        const rows = await selectFinancialDocumentByReferenceId(
            tx,
            value,
            organizationId
        );

        if (!rows) {
            return null;
        }

        return FinancialDocumentDataMapper.fromRows(rows);
    }
}
