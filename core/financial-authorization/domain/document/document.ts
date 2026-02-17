import { randomUUID } from 'crypto';
import { applySpec, find, prop, propEq, propOr } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import {
    Authflow,
    approveAuthflow,
    findAuthflowByAction,
} from '../authflow/authflow';
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
    groupId: string;
    approver: Approver;
};

type ApproveWithAuthflow = ApproveDocumentInput & { authflow: Authflow };

const findAuthflow = (
    data: ApproveDocumentInput
): Result<DomainError, ApproveWithAuthflow> =>
    findAuthflowByAction(data.document.authflows, data.action).map(
        (authflow) => ({ ...data, authflow })
    );

const applyAuthflowApproval = (
    data: ApproveWithAuthflow
): Result<DomainError, FinancialDocument> =>
    approveAuthflow({
        authflow: data.authflow,
        groupId: data.groupId,
        approver: data.approver,
    }).map((updatedAuthflow) => ({
        ...data.document,
        authflows: data.document.authflows.map((a) =>
            a.id === data.authflow.id ? updatedAuthflow : a
        ),
    }));

export const approveDocument = (
    data: ApproveDocumentInput
): Result<DomainError, FinancialDocument> =>
    Result.ok<DomainError, ApproveDocumentInput>(data)
        .flatMap(findAuthflow)
        .flatMap(applyAuthflowApproval);
