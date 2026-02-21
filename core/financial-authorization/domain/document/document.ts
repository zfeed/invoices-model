import { applySpec, find, prop, propEq, propOr } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { WithEvents, withEvents } from '../../../../building-blocks/events/with-events';
import { Money } from '../money/money';
import { Approver } from '../approver/approver';
import { Action } from '../action/action';
import { Authflow, approveAuthflow, canApproverApprove as canApproverApproveAuthflow } from '../authflow/authflow';
import { ReferenceId } from '../reference-id/reference-id';
import { createId, Id } from '../id/id';
import { Version } from '../version/version';
import { noDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions';
import { DocumentCreatedEvent } from './events/document-created.event';
import { DocumentApprovedEvent } from './events/document-approved.event';

export type FinancialDocument = {
    id: Id;
    referenceId: ReferenceId;
    value: Money;
    authflows: Authflow[];
    version: Version;
};

type DocumentInput = {
    referenceId: ReferenceId;
    value: Money;
    authflows: Authflow[];
};

type RebuildDocumentInput = DocumentInput & { id: Id; version: Version };

const buildDocument = applySpec<FinancialDocument>({
    id: () => createId(),
    referenceId: prop('referenceId'),
    value: prop('value'),
    authflows: prop('authflows'),
    version: () => 0,
});

const rebuildDocument = applySpec<FinancialDocument>({
    id: prop('id'),
    referenceId: prop('referenceId'),
    value: prop('value'),
    authflows: prop('authflows'),
    version: prop('version'),
});

export const createDocument = (
    data: DocumentInput
): Result<DomainError, WithEvents<FinancialDocument, DocumentCreatedEvent>> =>
    Result.ok<DomainError, DocumentInput>(data)
        .flatMap(noDuplicateAuthflowActions)
        .map(buildDocument)
        .map((doc) =>
            withEvents(doc, [new DocumentCreatedEvent(doc)])
        );

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

type CanApproverApproveInput = {
    document: FinancialDocument;
    action: Action;
    approverId: Id;
};

export const canApproverApprove = (
    data: CanApproverApproveInput
): boolean =>
    canApproverApproveAuthflow({
        authflows: data.document.authflows,
        action: data.action,
        approverId: data.approverId,
    });

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
            value: data.document.value,
            authflows: data.document.authflows.map((a) =>
                a.action === data.action ? updatedAuthflow : a
            ),
            version: data.document.version,
        });

export const approveDocument = (
    data: ApproveDocumentInput
): Result<DomainError, WithEvents<FinancialDocument, DocumentApprovedEvent>> =>
    Result.ok<DomainError, ApproveDocumentInput>(data)
        .flatMap(applyAuthflowApproval)
        .flatMap(buildApprovedDocument(data))
        .map((doc) =>
            withEvents(doc, [new DocumentApprovedEvent(doc)])
        );
