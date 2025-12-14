import { randomUUID } from 'crypto';
import { applySpec, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Authflow } from '../authflow/authflow';
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
