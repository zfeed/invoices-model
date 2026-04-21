import { FinancialDocument } from '../../domain/document/document.ts';
import type { selectFinancialDocument } from '../financial-document.persister.ts';
import { AuthflowDataMapper, AuthflowRecord } from './authflow.data-mapper.ts';
import { IdDataMapper, IdRecord } from './id.data-mapper.ts';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper.ts';
import {
    ReferenceIdDataMapper,
    ReferenceIdRecord,
} from './reference-id.data-mapper.ts';

export type FinancialDocumentRecord = {
    id: IdRecord;
    referenceId: ReferenceIdRecord;
    value: MoneyRecord;
    authflows: AuthflowRecord[];
};

export type FinancialDocumentRows = NonNullable<
    Awaited<ReturnType<typeof selectFinancialDocument>>
>;

export class FinancialDocumentDataMapper extends FinancialDocument {
    static from(document: FinancialDocument): FinancialDocumentDataMapper {
        return Object.setPrototypeOf(
            document,
            FinancialDocumentDataMapper.prototype
        ) as FinancialDocumentDataMapper;
    }

    static fromRows(rows: FinancialDocumentRows): FinancialDocumentDataMapper {
        const { document, authflows, steps, groups, approvers, approvals } =
            rows;

        const record: FinancialDocumentRecord = {
            id: { value: document.id },
            referenceId: { value: document.reference_id },
            value: {
                amount: document.value_amount,
                currency: document.value_currency,
            },
            authflows: authflows.map((authflow) => ({
                id: { value: authflow.id },
                action: { value: authflow.action },
                range: {
                    from: {
                        amount: authflow.range_from_amount,
                        currency: authflow.range_from_currency,
                    },
                    to: {
                        amount: authflow.range_to_amount,
                        currency: authflow.range_to_currency,
                    },
                },
                steps: steps
                    .filter((s) => s.authflow_id === authflow.id)
                    .map((step) => ({
                        id: { value: step.id },
                        order: { value: step.order },
                        isApproved: false,
                        groups: groups
                            .filter((g) => g.step_id === step.id)
                            .map((group) => ({
                                id: { value: group.id },
                                requiredApprovals: group.required_approvals,
                                approvers: approvers
                                    .filter((a) => a.group_id === group.id)
                                    .map((approver) => ({
                                        id: { value: approver.id },
                                        name: { value: approver.name },
                                        email: { value: approver.email },
                                    })),
                                approvals: approvals
                                    .filter((a) => a.group_id === group.id)
                                    .map((approval) => ({
                                        approverId: {
                                            value: approval.approver_id,
                                        },
                                        createdAt: {
                                            value: approval.created_at.toISOString(),
                                        },
                                        comment: {
                                            value: approval.comment,
                                        },
                                    })),
                            })),
                    })),
            })),
        };

        return FinancialDocumentDataMapper.fromRecord(record);
    }

    static fromRecord(
        record: FinancialDocumentRecord
    ): FinancialDocumentDataMapper {
        return new FinancialDocumentDataMapper(
            IdDataMapper.fromRecord(record.id),
            ReferenceIdDataMapper.fromRecord(record.referenceId),
            MoneyDataMapper.fromRecord(record.value),
            record.authflows.map((a) => AuthflowDataMapper.fromRecord(a))
        );
    }

    toRecord(): FinancialDocumentRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            referenceId: ReferenceIdDataMapper.from(
                this._referenceId
            ).toRecord(),
            value: MoneyDataMapper.from(this._value).toRecord(),
            authflows: this._authflows.map((a) =>
                AuthflowDataMapper.from(a).toRecord()
            ),
        };
    }
}
