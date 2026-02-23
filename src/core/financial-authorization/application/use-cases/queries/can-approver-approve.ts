import { createAction } from '../../../domain/action/action';
import { canApproverApprove } from '../../../domain/document/document';
import { fromString } from '../../../domain/id/id';
import { createReferenceId } from '../../../domain/reference-id/reference-id';
import { DocumentStorage } from '../../storage/document-storage.interface';

export type ApprovalAnswer = 'YES' | 'NO' | 'UNKNOWN';

export const canApproverApproveQuery = (documentStorage: DocumentStorage) => ({
    can: (approverId: string) => ({
        perform: (action: string) => ({
            on: (referenceId: string) => ({
                ask: async (): Promise<ApprovalAnswer> => {
                    const approverIdResult = fromString(approverId);
                    if (approverIdResult.isError()) return 'UNKNOWN';
                    const validApproverId = approverIdResult.unwrap();

                    const actionResult = createAction(action);
                    if (actionResult.isError()) return 'UNKNOWN';
                    const validAction = actionResult.unwrap();

                    const referenceIdResult = createReferenceId(referenceId);
                    if (referenceIdResult.isError()) return 'UNKNOWN';
                    const validReferenceId = referenceIdResult.unwrap();

                    const found = await documentStorage
                        .findByReferenceId(validReferenceId)
                        .run();

                    return found.fold(
                        (): ApprovalAnswer => 'UNKNOWN',
                        (document): ApprovalAnswer =>
                            canApproverApprove({
                                document,
                                action: validAction,
                                approverId: validApproverId,
                            })
                                ? 'YES'
                                : 'NO'
                    );
                },
            }),
        }),
    }),
});
