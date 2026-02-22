import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { Action, createAction } from '../../../domain/action/action';
import { Approver } from '../../../domain/approver/approver';
import { approveDocument, FinancialDocument } from '../../../domain/document/document';
import { ReferenceId } from '../../../domain/reference-id/reference-id';
import { DocumentStorage } from '../../storage/document-storage.interface';

type ApproveActionRequest = {
    referenceId: ReferenceId;
    action: Action;
    approver: Approver;
};

export const approveActionOnDocumentCommand =
    (documentStorage: DocumentStorage, domainEvents: DomainEvents) =>
    async (
        request: ApproveActionRequest
    ): Promise<Result<DomainError, FinancialDocument>> => {
        const actionResult = createAction(request.action);
        if (actionResult.isError()) {
            return Result.error(actionResult.unwrapError());
        }

        const found = await documentStorage
            .findByReferenceId(request.referenceId)
            .run();

        const document = found.fold(
            () => null,
            (doc) => doc
        );

        if (!document) {
            return Result.error(
                new DomainError({
                    message: `Document with reference ${request.referenceId} not found`,
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
                })
            );
        }

        const result = approveDocument({
            document,
            action: request.action,
            approver: request.approver,
        });

        if (result.isError()) {
            return result.error();
        }

        const approved = result.unwrap();
        const saved = await documentStorage.save(approved).run();

        await domainEvents.publishEvents(approved);

        return saved;
    };
