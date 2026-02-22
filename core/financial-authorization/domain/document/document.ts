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

export const approveDocument = (
    document: FinancialDocument,
    action: Action,
    approver: Approver
): Result<DomainError, WithEvents<FinancialDocument, DocumentApprovedEvent>> =>
    approveAuthflow(document.authflows, action, approver).flatMap(
        (updatedAuthflow) =>
            recreateDocument({
                id: document.id,
                referenceId: document.referenceId,
                value: document.value,
                authflows: document.authflows.map((a) =>
                    a.action === action ? updatedAuthflow : a
                ),
                version: document.version,
            }).map((doc) => withEvents(doc, [new DocumentApprovedEvent(doc)]))
    );
