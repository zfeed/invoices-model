import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes';
import { ApplicationError } from '../../../../../shared/errors/application/application.error';
import { Id } from '../../../domain/id/id';
import { Invoice } from '../../../domain/invoice/invoice';
import { Session } from '../../../../../shared/unit-of-work/unit-of-work';

export class CancelInvoice {
    constructor(private readonly session: Session) {}

    public async execute(id: string) {
        await using unitOfWork = await this.session.begin();

        const invoice = await unitOfWork
            .collection(Invoice)
            .get(Id.fromString(id));

        if (!invoice) {
            throw new ApplicationError({
                message: 'Invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        invoice.cancel().unwrap();

        await unitOfWork.commit();

        return invoice.toPlain();
    }
}
