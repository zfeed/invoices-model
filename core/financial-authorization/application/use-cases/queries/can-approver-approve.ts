import { Action, createAction } from '../../../domain/action/action';
import { canApproverApprove } from '../../../domain/document/document';
import { Id } from '../../../domain/id/id';
import { ReferenceId } from '../../../domain/reference-id/reference-id';
import { DocumentStorage } from '../../storage/document-storage.interface';

export type ApprovalAnswer = 'YES' | 'NO' | 'UNKNOWN';

export const canApproverApproveQuery = (documentStorage: DocumentStorage) => ({
    can: (approverId: Id) => ({
        perform: (action: Action) => ({
            on: (referenceId: ReferenceId) => ({
                ask: async (): Promise<ApprovalAnswer> => {
                    const actionResult = createAction(action).unwrap();

                    const found = await documentStorage
                        .findByReferenceId(referenceId)
                        .run();

                    return found.fold(
                        (): ApprovalAnswer => 'UNKNOWN',
                        (document): ApprovalAnswer =>
                            canApproverApprove({
                                document,
                                action,
                                approverId,
                            })
                                ? 'YES'
                                : 'NO'
                    );
                },
            }),
        }),
    }),
});
