import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes.ts';
import { ApplicationError } from '../../../../../shared/errors/application/application.error.ts';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice.ts';
import { Id } from '../../../domain/id/id.ts';
import { Session } from '../../../../../shared/unit-of-work/unit-of-work.ts';
import { DraftInvoiceDto } from '../../queries/get-draft-invoice/draft-invoice.dto.ts';

export class DraftDraftInvoice {
    constructor(private readonly session: Session) {}

    public async execute(id: string) {
        await using unitOfWork = await this.session.begin();

        const draftInvoice = await unitOfWork
            .collection(DraftInvoice)
            .get(Id.fromString(id));

        if (!draftInvoice) {
            throw new ApplicationError({
                message: 'Draft invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        draftInvoice.draft().unwrap();

        await unitOfWork.commit();

        return DraftInvoiceDto.fromDraftInvoice(draftInvoice);
    }
}
