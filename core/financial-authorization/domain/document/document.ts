import { randomUUID } from 'crypto';
import { applySpec, find, prop, propEq, propOr } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import { Authflow, approveAuthflow } from '../authflow/authflow';
import { noDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions';

export type FinancialDocument = {
    id: string;
    referenceId: string;
    authflows: Authflow[];
};

type DocumentInput = {
    referenceId: string;
    authflows: Authflow[];
};

const buildDocument = applySpec<FinancialDocument>({
    id: () => randomUUID(),
    referenceId: prop('referenceId'),
    authflows: prop('authflows'),
});

export const createDocument = (
    data: DocumentInput
): Result<DomainError, FinancialDocument> =>
    Result.ok<DomainError, DocumentInput>(data)
        .flatMap(noDuplicateAuthflowActions)
        .map(buildDocument);

export const isActionApproved = (
    document: FinancialDocument,
    action: string
): boolean =>
    propOr(
        false,
        'isApproved',
        find(propEq(action, 'action'), document.authflows)
    );

type ApproveDocumentInput = {
    document: FinancialDocument;
    action: string;
    approver: Approver;
};

const applyAuthflowApproval = (
    data: ApproveDocumentInput
): Result<DomainError, FinancialDocument> =>
    approveAuthflow({
        authflows: data.document.authflows,
        action: data.action,
        approver: data.approver,
    }).map((updatedAuthflow) => ({
        ...data.document,
        authflows: data.document.authflows.map((a) =>
            a.action === data.action ? updatedAuthflow : a
        ),
    }));

export const approveDocument = (
    data: ApproveDocumentInput
): Result<DomainError, FinancialDocument> =>
    Result.ok<DomainError, ApproveDocumentInput>(data).flatMap(
        applyAuthflowApproval
    );
