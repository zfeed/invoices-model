import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Session } from '../../../shared/unit-of-work/unit-of-work';
import { Action } from '../../domain/action/action';
import { Approval } from '../../domain/approval/approval';
import { Approver } from '../../domain/approver/approver';
import { FinancialDocument } from '../../domain/document/document';
import { ReferenceId } from '../../domain/reference-id/reference-id';

type ApproveActionRequest = {
    referenceId: string;
    action: string;
    approver: Approver;
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
            throw new DomainError({
                message: `Document with reference ${referenceId.toPlain()} not found`,
                code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
            });
        }

        const approval = Approval.create({
            approverId: request.approver.id,
            comment: null,
        }).unwrap();
        document.apply(action, approval).unwrap();

        await uow.commit();

        return document.toPlain();
    }
}
