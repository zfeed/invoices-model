import { randomUUID } from 'crypto';
import { applySpec, find, prop, propEq, propOr } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Approver } from '../approver/approver';
import { Authflow, createAuthflow } from '../authflow/authflow';
import { approveStep, Step } from '../step/step';
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

type ApproveWithStep = ApproveWithAuthflow & { step: Step };

const findAuthflow = (
    data: ApproveDocumentInput
): Result<DomainError, ApproveWithAuthflow> => {
    const authflow = data.document.authflows.find(
        (a) => a.action === data.action
    );
    return authflow
        ? Result.ok({ ...data, authflow })
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE,
                  message: `Authflow with action ${data.action} not found`,
              })
          );
};

const findCurrentStep = (
    data: ApproveWithAuthflow
): Result<DomainError, ApproveWithStep> => {
    const step = data.authflow.steps
        .filter((s) => !s.isApproved)
        .sort((a, b) => a.order - b.order)[0];
    return step
        ? Result.ok({ ...data, step })
        : Result.error(
              new DomainError({
                  code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE,
                  message: `No pending steps found for action ${data.action}`,
              })
          );
};

const applyStepApproval = (
    data: ApproveWithStep
): Result<DomainError, FinancialDocument> =>
    approveStep({
        step: data.step,
        groupId: data.groupId,
        approver: data.approver,
    })
        .flatMap((updatedStep) =>
            createAuthflow({
                action: data.authflow.action,
                steps: data.authflow.steps.map((s) =>
                    s.id === data.step.id ? updatedStep : s
                ),
            })
        )
        .map((updatedAuthflow) => ({
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
        .flatMap(findCurrentStep)
        .flatMap(applyStepApproval);
