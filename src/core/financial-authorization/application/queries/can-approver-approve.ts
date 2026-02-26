import { Session } from '../../../shared/unit-of-work/unit-of-work.interface';
import { Action } from '../../domain/action/action';
import { FinancialDocument } from '../../domain/document/document';
import { Id } from '../../domain/id/id';
import { ReferenceId } from '../../domain/reference-id/reference-id';

export type ApprovalAnswer = 'YES' | 'NO' | 'UNKNOWN';

export class CanApproverApprove {
    constructor(private readonly session: Session) {}

    public can(approverId: string) {
        return {
            perform: (action: string) => ({
                on: (referenceId: string) => ({
                    ask: () => this.ask(approverId, action, referenceId),
                }),
            }),
        };
    }

    private async ask(
        approverId: string,
        action: string,
        referenceId: string
    ): Promise<ApprovalAnswer> {
        const validApproverId = Id.fromPlain(approverId);

        const actionResult = Action.create(action);
        if (actionResult.isError()) {
            return 'UNKNOWN';
        }
        const validAction = actionResult.unwrap();

        const referenceIdResult = ReferenceId.create(referenceId);
        if (referenceIdResult.isError()) {
            return 'UNKNOWN';
        }
        const validReferenceId = referenceIdResult.unwrap();

        await using uow = await this.session.begin();

        const document = await uow
            .collection(FinancialDocument)
            .findBy('referenceId', validReferenceId.toPlain());

        if (!document) {
            return 'UNKNOWN';
        }

        return document.canApproverApprove(validAction, validApproverId)
            ? 'YES'
            : 'NO';
    }
}
