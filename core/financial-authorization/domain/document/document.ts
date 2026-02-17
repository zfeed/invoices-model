import { applySpec, find, prop, propEq, propOr } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import { Action } from '../action/action';
import { Authflow, approveAuthflow } from '../authflow/authflow';
import { ReferenceId } from '../reference-id/reference-id';
import { createId, Id } from '../id/id';
import { noDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions';

export type FinancialDocument = {
    id: Id;
    referenceId: ReferenceId;
    authflows: Authflow[];
};

type DocumentInput = {
    referenceId: ReferenceId;
    authflows: Authflow[];
};

type RebuildDocumentInput = DocumentInput & { id: Id };

const buildDocument = applySpec<FinancialDocument>({
    id: () => createId(),
    referenceId: prop('referenceId'),
    authflows: prop('authflows'),
});

const rebuildDocument = applySpec<FinancialDocument>({
    id: prop('id'),
    referenceId: prop('referenceId'),
    authflows: prop('authflows'),
});

export const createDocument = (
    data: DocumentInput
): Result<DomainError, FinancialDocument> =>
    Result.ok<DomainError, DocumentInput>(data)
        .flatMap(noDuplicateAuthflowActions)
        .map(buildDocument);

const recreateDocument = (
    data: RebuildDocumentInput
): Result<DomainError, FinancialDocument> =>
    Result.ok<DomainError, RebuildDocumentInput>(data)
        .flatMap(noDuplicateAuthflowActions)
        .map(rebuildDocument);

export const isActionApproved = (
    document: FinancialDocument,
    action: Action
): boolean =>
    propOr(
        false,
        'isApproved',
        find(propEq(action, 'action'), document.authflows)
    );

type ApproveDocumentInput = {
    document: FinancialDocument;
    action: Action;
    approver: Approver;
};

const applyAuthflowApproval = (
    data: ApproveDocumentInput
): Result<DomainError, Authflow> =>
    approveAuthflow({
        authflows: data.document.authflows,
        action: data.action,
        approver: data.approver,
    });

const buildApprovedDocument =
    (
        data: ApproveDocumentInput
    ): ((
        updatedAuthflow: Authflow
    ) => Result<DomainError, FinancialDocument>) =>
    (updatedAuthflow) =>
        recreateDocument({
            id: data.document.id,
            referenceId: data.document.referenceId,
            authflows: data.document.authflows.map((a) =>
                a.action === data.action ? updatedAuthflow : a
            ),
        });

export const approveDocument = (
    data: ApproveDocumentInput
): Result<DomainError, FinancialDocument> =>
    Result.ok<DomainError, ApproveDocumentInput>(data)
        .flatMap(applyAuthflowApproval)
        .flatMap(buildApprovedDocument(data));
