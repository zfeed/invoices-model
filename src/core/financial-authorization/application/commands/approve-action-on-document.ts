import { KNOWN_ERROR_CODE } from '../../../bulding-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../bulding-blocks/errors/app-known-error.ts';
import { Session } from '../../../bulding-blocks/unit-of-work/unit-of-work.ts';
import { Action } from '../../domain/action/action.ts';
import { Approval } from '../../domain/approval/approval.ts';
import { FinancialDocument } from '../../domain/document/document.ts';
import { Id } from '../../domain/id/id.ts';
import { ReferenceId } from '../../domain/reference-id/reference-id.ts';

type ApproveActionRequest = {
    referenceId: string;
    action: string;
    approverId: string;
};

export class ApproveActionOnDocument {
    constructor(private readonly session: Session) {}

    public async execute(request: ApproveActionRequest) {
        const action = Action.create(request.action).unwrap();
        const referenceId = ReferenceId.create(request.referenceId).unwrap();

        await using uow = await this.session.begin();

        const document = await uow
            .collection(FinancialDocument)
            .findBy('referenceId', referenceId.toPlain());

        if (!document) {
            throw new AppKnownError({
                message: `Document with reference ${referenceId.toPlain()} not found`,
                code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
            });
        }

        const approval = Approval.create({
            approverId: Id.fromString(request.approverId),
            comment: null,
        }).unwrap();
        document.apply(action, approval).unwrap();

        await uow.commit();

        return document.toPlain();
    }
}
