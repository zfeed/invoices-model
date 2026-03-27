import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes';
import { ApplicationError } from '../../../../../shared/errors/application/application.error';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice';
import { Id } from '../../../domain/id/id';
import { Session } from '../../../../../shared/unit-of-work/unit-of-work';

export class ArchiveDraftInvoice {
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

        draftInvoice.archive().unwrap();

        await unitOfWork.commit();

        return draftInvoice.toPlain();
    }
}
