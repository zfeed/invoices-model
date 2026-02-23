import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { createAction } from '../../../domain/action/action';
import { Approver } from '../../../domain/approver/approver';
import { approveDocument, documentToPlain, PlainFinancialDocument } from '../../../domain/document/document';
import { createReferenceId } from '../../../domain/reference-id/reference-id';
import { DocumentStorage } from '../../storage/document-storage.interface';

type ApproveActionRequest = {
    referenceId: string;
    action: string;
    approver: Approver;
};

export const approveActionOnDocumentCommand =
    (documentStorage: DocumentStorage, domainEvents: DomainEvents) =>
    async (
        request: ApproveActionRequest
    ): Promise<PlainFinancialDocument> => {
        const action = createAction(request.action).unwrap();
        const referenceId = createReferenceId(request.referenceId).unwrap();

        const found = await documentStorage
            .findByReferenceId(referenceId)
            .run();

        const document = found.fold(
            () => null,
            (doc) => doc
        );

        if (!document) {
            throw new DomainError({
                message: `Document with reference ${referenceId} not found`,
                code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
            });
        }

        const approved = approveDocument(
            document,
            action,
            request.approver
        ).unwrap();

        const saved = await documentStorage.save(approved).run();

        await domainEvents.publishEvents(approved);

        return saved.map(documentToPlain).unwrap();
    };
